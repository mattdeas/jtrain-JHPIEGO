import React, { useState, useEffect } from 'react';
import { useDataQuery, useDataMutation } from '@dhis2/app-runtime';
import { StaffSearchAttendees } from './StaffSearchAttendees';
import { StaffShow } from './CourseDateAttendees-StaffShow';
import { utilConfigConstantValueByName } from '../utils/utils';
import { CircularLoader } from '@dhis2/ui';

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

  const dataElementObject = dataEvent.events.dataValues.find(
    (dataValue) => dataValue.dataElement === utilConfigConstantValueByName('CourseAttendees')
  );
  
  const attendeeCountObj = dataEvent.events.dataValues.find(
     (dataValue) => dataValue.dataElement === utilConfigConstantValueByName('CourseAttendeesCount')
    //(dataValue) => dataValue.dataElement === "IA7YxfolpEM"
  );

  const attendeeCount = parseInt(attendeeCountObj.value)
    return (
      <div>
      <div style={{ height: '40vh', overflowY: 'auto' }}>
      <h3>Course Attendees </h3>
      {loading ? <CircularLoader small /> : ( // Show the loader if loading is true
          <table>
              <tbody>
              {dataElementObject ? (
              <StaffShow tei_id={dataElementObject.value} eventID={eventID} reload={reload}  refreshCount={refreshCount} onRemove={handleReload} key={refreshCount} />
            ) : (
              <tr><td>No attendees</td></tr>
            )}
              </tbody>
            </table>
      )}
      </div>

      {/* <StaffSearchAttendees eventID={eventID} dataEvent={dataEvent} tei_id={dataElementObject && dataElementObject.value ? dataElementObject.value : ""} tei_count={attendeeCount} dElements={dElements} onAssign={handleReload} refreshCount={refreshCount} reload={reload} key={refreshCount}/> */}
      {dElements && (
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
        )}
  </div>
    );
}