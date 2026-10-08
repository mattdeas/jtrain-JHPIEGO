import React, { useState, useEffect } from 'react';
import { useDataQuery, useDataMutation } from '@dhis2/app-runtime';
import { StaffSearchAttendees } from './StaffSearchAttendees';
import { StaffShow } from './CourseDateAttendees-StaffShow';
import { utilConfigConstantValueByName } from '../utils/utils';
import { CircularLoader } from '@dhis2/ui';

/**
 * CourseDateAttendees
 * Shows who is enrolled on a course date (event) and, when dElements is provided,
 * the search panel for enrolling more trainees.
 *
 * How enrolment is stored (relationships were shelved due to a DHIS2 bug):
 *  - Course event data element 'CourseAttendees'      : ';'-separated list of trainee TEI IDs
 *  - Course event data element 'CourseAttendeesCount' : number of attendees
 *  - Each trainee also gets a Staff program event whose 'CourseEventId' points back to this event
 *
 * Props:
 *  - eventID   : course date event ID
 *  - dElements : data element IDs on the course events; pass null to hide the enrol panel (read-only view)
 *  - onDelete  : currently unused
 */
export const CourseDateAttendees = ({ eventID, dElements, onDelete }) => {
  
    const [reload, setReload] = useState(false);
    const [refreshCount,setRefreshCount] = useState(0)

    const [loading, setLoading] = useState(false); // Add a new state variable for loading

   



    const eventQuery = (eventID) => ({
      events: {
        resource: `events/${eventID}`,
        id: ({ eventID }) => eventID,
        params: {
          fields: 'event,eventDate,dataValues[dataElement,value]',
        },
      },
    });


    // Called after a trainee is added/removed: bump refreshCount so the attendee list and
    // search panel re-mount/refetch, and reload this event to get the new attendee list/count
    const handleReload = () => {
      setLoading(true);
      console.log('REFRESHES-START')
      setReload(prevReload => !prevReload);
      setRefreshCount(prevKey => prevKey + 1);
      refetchEvent().finally(() => {
          setLoading(false);
      });
    };


  const { loading: loadingEvent, error: errorEvent, data: dataEvent, refetch: refetchEvent } = useDataQuery(eventQuery(eventID), [reload]);

  if (loadingEvent) return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <CircularLoader small />
      <span>Loading...</span>
    </div>
  );
  if (errorEvent) return <span>Error1: {errorEvent.message}</span>;

  // Attendee TEI list and count, read from the course event's data values
  const dataElementObject = dataEvent.events.dataValues.find(
    (dataValue) => dataValue.dataElement === utilConfigConstantValueByName('CourseAttendees')
  );
  
  const attendeeCountObj = dataEvent.events.dataValues.find(
     (dataValue) => dataValue.dataElement === utilConfigConstantValueByName('CourseAttendeesCount')
    //(dataValue) => dataValue.dataElement === "IA7YxfolpEM"
  );

  // Note: throws if the event has no count data value yet
  const attendeeCount = parseInt(attendeeCountObj.value)
    // Enrol search (left) and attendees (right) sit side by side on wide screens and stack on narrow ones,
    // search first - a new course date starts with no attendees, so the search is where work begins.
    // Each panel sizes to its content; only the attendee table scrolls (see StaffShow).
    const panelStyle = { flex: '1 1 480px', minWidth: 0 };
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
      {/* <StaffSearchAttendees eventID={eventID} dataEvent={dataEvent} tei_id={dataElementObject && dataElementObject.value ? dataElementObject.value : ""} tei_count={attendeeCount} dElements={dElements} onAssign={handleReload} refreshCount={refreshCount} reload={reload} key={refreshCount}/> */}
      {dElements && (
        <div style={panelStyle}>
          <StaffSearchAttendees
            eventID={eventID} 
            dataEvent={dataEvent} 
            tei_id={dataElementObject && dataElementObject.value ? dataElementObject.value : ""} 
            tei_count={attendeeCount} 
            dElements={dElements} 
            onAssign={handleReload} 
            refreshCount={refreshCount} 
            reload={reload}
          />
        </div>
        )}

      <div style={panelStyle}>
      <h3>Course Attendees </h3>
      {loading ? <CircularLoader small /> : ( // Show the loader if loading is true
          dataElementObject ? (
              <StaffShow tei_id={dataElementObject.value} eventID={eventID} reload={reload}  refreshCount={refreshCount} onRemove={handleReload} key={refreshCount} />
            ) : (
              <p>No attendees</p>
            )
      )}
      </div>
  </div>
    );
}