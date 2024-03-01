import { useDataQuery,useDataMutation } from '@dhis2/app-runtime'
import {
    Table,
    TableBody,
    TableCell,
    TableCellHead,
    TableHead,
    TableRow,
    TableRowHead,
} from '@dhis2/ui'
import React, { useState, useEffect } from 'react'
import { Link} from 'react-router-dom'
import { CourseDateAttendeesStaffCustomFields } from './CourseDateAttendees-Staff-CustomFields';
import { getConstantValueByName } from '../utils';


function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const handleResize = debounce(() => {
}, 200);

window.addEventListener('resize', handleResize);





const qryStaffCourseDetails = {  
    events: {
        resource: 'events',
        params: ({ ou, program, filterEventDE, EventDE }) => ({
            ou: ou,
            program: program,
            filter: filterEventDE + ':eq:' + EventDE,
            pageSize: 1000,
            fields: 'event,trackedEntityInstance',
        }),
    },
}


const eventQuery = (eventID) => ({
    events: {
      resource: `events/${eventID}`,
    //   params: {
    //     fields: 'event,eventDate,dataValues[dataElement,value]',
    //   },
    },
  });

  const deleteMutation = {
    resource: 'events',
    id: ({ id }) => id,
    type: 'delete',
  };
  
  const updateMutation = {
    resource: 'events',
    id: ({ id }) => id,
    data: ({ data }) => data,
    type: 'update',
  };


export const CourseDateStaffShow = ({tei_id, eventID}) => {
    const [eventIds, setEventIds] = useState([]);
    const [currentEventId, setCurrentEventId] = useState(null);
    const [eventData, setEventData] = useState([]);
    const [deleteEvent] = useDataMutation(deleteMutation);
    const [updateEvent] = useDataMutation(updateMutation);

    console.log('tei_id:', tei_id);
    console.log('eventID:', eventID);

    const defStaffTEI = getConstantValueByName('jtrain-TEI-Type-Staff')
    const defStaffOrg = getConstantValueByName('jtrain-DefaultStaffOrgUnit')

    const defStaffProgram = getConstantValueByName('jtrain-staffprogram')
    const defStaffCourseDE = getConstantValueByName('jtrain-course-eventid')
    const defCourseAttendeesDE = getConstantValueByName('jtrain-course-attendees')
    const defCourseAttendeesCountDE = getConstantValueByName('jtrain-course-attendees-count')
    
  

    const query = {  
            instances: {
                resource: 'trackedEntityInstances',
                params: () => ({
                    ou : defStaffOrg,
                    trackedEntityType : defStaffTEI,
                    trackedEntityInstance: tei_id,
            }),
        },
    }
    const { loading, error, data } = useDataQuery(query);
    
    const { loading: loadingSCD, error: errorSCD, data: dataSCD } = useDataQuery(qryStaffCourseDetails, {
        variables: {
            ou: defStaffOrg,
            program: defStaffProgram,
            filterEventDE: defStaffCourseDE,
            EventDE: eventID,
        },
    });


    console.log('tei_id:', tei_id);
    console.log('dataSCD:', dataSCD);

    const handleDelete = async (trackedEntityInstance) => {
        // Delete the event
        console.log('handleDeleteeventID:', eventID);
        console.log('handleDeletetrackedEntityInstance:', trackedEntityInstance);
        await deleteEvent({ id: eventID });
        
    
        // Fetch the event data
        const dataValues = await fetchEvent(eventID);
        
        // Modify the dataValues
        dataValues.forEach(item => {
          if (item.dataElement === defCourseAttendeesDE) {
            item.value -= 1;
          } else if (item.dataElement === defCourseAttendeesCountDE) {
            item.value = item.value.replace(new RegExp(trackedEntityInstance + ';', 'g'), '');
          }
        });
    
        // Re-upload the modified data
        //await updateEvent({ id: eventID, data: { dataValues } });
      };
    
    useEffect(() => {
        //console.log('dataSCD:', dataSCD);
        if (dataSCD) {
            setEventIds(dataSCD.events.events);
        }
    }, [dataSCD]);
    
    useEffect(() => {
        //console.log('eventIds:', eventIds);
        if (eventIds.length > 0) {
            setCurrentEventId(eventIds[0].event);
        }
    }, [eventIds]);
    
    
//console.log('currentEventId:', currentEventId);
//console.log('currentEventIdObject', eventQuery(currentEventId));
const { loading: loadingEvent, error: errorEvent, data: dataEvent } = useDataQuery(eventQuery(currentEventId), {
    skip: !currentEventId,
});

    console.log('setEventIds:', eventIds);
    
   
    return (

        <div> 
            {
                // display that the data is being loaded
                // when loading is true
                loading && 'Loading...'
            }

            {
                // display the error message
                // is an error occurred
                error && error.message
                
            }

            {
                // if there is any data available
                data?.instances?.trackedEntityInstances && (
                    <Table>
      <TableHead>
        <TableRowHead>
          <TableCellHead>Family Name</TableCellHead>
          <TableCellHead>First Name</TableCellHead>
          <TableCellHead>Gender</TableCellHead>
          <TableCellHead>Date of Birth</TableCellHead>
          <TableCellHead>Age</TableCellHead>
          <TableCellHead>Open</TableCellHead>
        </TableRowHead>
      </TableHead>
      <TableBody>
      {data.instances.trackedEntityInstances
    .slice(0, 10)
    .map(
        ({ trackedEntityInstance, attributes }) => {
            // Create an object from the attributes array
            const attributesObj = attributes.reduce((obj, item) => {
                obj[item.displayName] = item.value;
                return obj;
            }, {});

            let matchingEventValue = null;
            if (dataSCD) {
                const matchingEvent = dataSCD.events.events.find(event => event.trackedEntityInstance === trackedEntityInstance);
                if (matchingEvent) {
                    console.log('Matching event:', matchingEvent.event);
                    matchingEventValue = matchingEvent.event; // Store the event value in the variable
                } else {
                    console.log('No matching event found');
                    console.log('matchingEventValue', matchingEventValue);
                }
            }

            if(matchingEventValue != null)
            {
            return (
                <TableRow key={trackedEntityInstance}>
                    <TableCell>{trackedEntityInstance}</TableCell>
                    <TableCell>{attributesObj['Family Name']}</TableCell>
                    <TableCell>{attributesObj['First Name']}</TableCell>
                    <TableCell>{attributesObj['Gender']}</TableCell>
                    <TableCell>{attributesObj['Date of Birth']}</TableCell>
                    <TableCell>{attributesObj['Age']}</TableCell>
                    <TableCell >
                        <Link to={`/staffview/${trackedEntityInstance}`}>View</Link>
                    </TableCell>
                    
                    <TableCell>
                        
                        <CourseDateAttendeesStaffCustomFields eventID={matchingEventValue}/>
                        
                    </TableCell>
                    <TableCell>
                        <button onClick={() => handleDelete(trackedEntityInstance)}>Delete</button>
                    </TableCell>
                </TableRow>
            );
            }
        }
    )}
                        </TableBody>
    </Table>
                )
            }
        </div>
    )
}
            
