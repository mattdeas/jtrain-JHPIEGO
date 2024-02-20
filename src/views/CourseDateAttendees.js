import React from 'react';
import { useDataQuery, useDataMutation } from '@dhis2/app-runtime';
import { StaffSearchAttendees } from './StaffSearchAttendees';
import { BrowserRouter as Router, Route, Link, Routes, useLocation , useParams} from 'react-router-dom';
import { CourseAttendee } from './CourseAttendee';
import { StaffShow } from './CourseDateAttendees-StaffShow';

const conVariableName = 'jtrain-course-attendees';


const constantsQuery = () => ({
    constants: {
      resource: 'constants',
      params: {
        filter: `name:eq:${conVariableName}`,
        fields: ['id', 'name', 'value', 'code'],
        paging: false,
      },
    },
  });


  const qryConstants = {
    // One query object in the whole query
    attributes: {
        // The `attributes` endpoint should be used
        resource: 'constants',
        params: {
            // Paging is disabled
            paging: false,
            // Only the attribute properties that are required should be loaded
            fields: 'id, displayName, code, value',
        },
    },
}

const qryTrackedEntityInstance = {
    trackedEntityInstance: {
        resource: 'trackedEntityInstances',
        id: ({ id }) => id,
        params: {
            fields: ['attributes[attribute,value]'],
        },
    },
};



export const CourseDateAttendees = ({ eventID }) => {
    const { id } = useParams();
    console.log('id:',id);
    console.log('eventID:',eventID);


    const eventQuery = (eventID) => ({
      events: {
        resource: `events/${eventID}`,
        id: ({ eventID }) => eventID,
        params: {
          fields: 'event,eventDate,dataValues[dataElement,value]',
        },
      },
    });
  
  const { loading: loadingEvent, error: errorEvent, data: dataEvent } = useDataQuery(eventQuery(eventID));

  console.log("Event dataValues:", dataEvent);

  if (loadingEvent) return <span>Loading...</span>;
  if (errorEvent) return <span>Error1: {errorEvent.message}</span>;

  console.log("Event dataValues:", dataEvent);
  console.log("Event dataValues2:", dataEvent.events.dataValues);

  // Find the object where dataElement is 'l9aHlXLsEyE'
  const dataElementObject = dataEvent.events.dataValues.find(
    (dataValue) => dataValue.dataElement === 'l9aHlXLsEyE'
  );

    
    return (
        <div>
            <h3>Course Date Attendees {eventID}</h3>
            <table>
                <tbody>
                  <StaffShow tei_id={dataElementObject.value}/>
                </tbody>
              </table>

            <StaffSearchAttendees eventID={eventID} dataEvent={dataEvent} tei_id={dataElementObject.value} />
        </div>
    );
}