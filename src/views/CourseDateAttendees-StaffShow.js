import { useDataQuery,useDataMutation, useDataEngine } from '@dhis2/app-runtime'
import React, { useState, useEffect } from 'react'
import { Link} from 'react-router-dom'
import { CourseDateAttendeesStaffCustomFields } from './CourseDateAttendees-Staff-CustomFields';
import { utilGetConstantValueByName } from '../utils/utils';
import { Table, TableBody, TableCell, TableCellHead, TableHead, TableRow, TableRowHead, IconView24, IconDelete24 } from '@dhis2/ui';

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
}

const handleResize = debounce(() => {}, 200);

window.addEventListener('resize', handleResize);

const query = {
    instances: {
        resource: 'trackedEntityInstances',
        params: ({ ou, trackedEntityType, tei_id }) => ({
            ou: ou,
            trackedEntityType: trackedEntityType,
            trackedEntityInstance: tei_id,
        }),
    },
};

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
};

const eventQuery = (eventID) => ({
    events: {
        resource: `events/${eventID}`,
    },
});


export const StaffShow = ({ tei_id, eventID, reload, refreshCount, onDelete }) => {
    const engine = useDataEngine();
    const [eventIds, setEventIds] = useState([]);
    const [currentEventId, setCurrentEventId] = useState(null);
    const [delTEIs, setDelTEIs] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);
    console.log('Current refresh key:', refreshKey);

    const defStaffEntityType = utilGetConstantValueByName('jtrain-TEI-Type-Staff');
    const defStaffOrgUnit = utilGetConstantValueByName('jtrain-DefaultStaffOrgUnit');
    const defCourseOrgUnitId = utilGetConstantValueByName('jtrain-defaultcourseorgunit');
    const defCourseEventId = utilGetConstantValueByName('jtrain-course-eventid');
    const defStaffProgram = utilGetConstantValueByName('jtrain-staffprogram');
    const defCourseProgramId = utilGetConstantValueByName('jtrain-courseprogram');
    const defCourseProgramStageId = utilGetConstantValueByName('jtrain-courseprogramstage');
    const defCourseAttendeesCountDEId = utilGetConstantValueByName('jtrain-course-attendees-count');
    const defCourseAttendeesId = utilGetConstantValueByName('jtrain-course-attendees');

    const { loading: loadingQry, error: errorQry, data: dataQry, refetch: refetchQry } = useDataQuery(query, {
        variables: {
            ou: defStaffOrgUnit,
            trackedEntityType: defStaffEntityType,
            tei_id: tei_id,
            refreshKey,
            lazy: true,
        },
        
    });


    const { loading: loadingSCD, error: errorSCD, data: dataSCD , refetch: refetchSCD} = useDataQuery(qryStaffCourseDetails, {
        variables: {
            ou: defCourseOrgUnitId,
            program: defStaffProgram,
            filterEventDE: defCourseEventId,
            EventDE: eventID,
            refreshKey,
        },
    });

    useEffect(() => {
        setRefreshKey(prevKey => prevKey + 1);
        refetchQry();
        refetchSCD();
        
    }, [dataQry, dataSCD, refetchQry, refetchSCD, reload, refreshCount]);

    const UpdateEvent = (program, programStage, orgUnit, event, dataValues, trackedEntityInstance) => ({
        resource: 'events',
        type: 'update',
        trackedEntityInstance,
        id: event,
        data: {
            event,
            program,
            programStage,
            orgUnit,
            dataValues,
        },

      });

      async function deleteEvent(id) {
        const mutation = {
            resource: 'events',
            id: id,
            type: 'delete',
        };
    
        try {
            const response = await engine.mutate(mutation);
            console.log('Event deleted:', response);
        } catch (error) {
            console.error('An error occurred:', error);
        }
    }

      const handleDelete = async (trackedEntityInstance, matchingEventValue) => {
        let updatedEventsTmp;
        try {
            console.log('Starting deletion process for:', trackedEntityInstance, matchingEventValue);
            // Delete the event associated with the TEI (Staffmember)
            if (matchingEventValue) {
                console.log('Deleting event:', matchingEventValue);
                await deleteEvent({ id: matchingEventValue });
                console.log('Event deleted');
                // Add the deleted trackedEntityInstance to delTEIs
                setDelTEIs(prevDelTEIs => [...prevDelTEIs, trackedEntityInstance]);
                console.log('Updated delTEIs:', delTEIs);
            }
        
            // Fetch the event data
            const query = {
                events: {
                    resource: 'events',
                    id: eventID,
                    params: {
                        fields: ['*'], // replace with the fields you want
                    },
                },
            }
        
            console.log('Fetching event data with query:', query);
            const response = await engine.query(query)
            console.log('Fetched event data:', response);
            updatedEventsTmp = response.events;
        } catch (error) {
            console.error('An error occurred:', error);
        }
    
        try{
            console.log('Preparing data for update:', updatedEventsTmp);
            // Prepare the data for the update
            updatedEventsTmp.dataValues.forEach(dataValue => {
                if (dataValue.dataElement === defCourseAttendeesCountDEId) {
                    console.log('Updating dataValue:', dataValue);
                    dataValue.value = parseInt(dataValue.value) - 1; // subtract 1
                    console.log('Updated dataValue:', dataValue);
                } else if (dataValue.dataElement === defCourseAttendeesId) {
                    console.log('Updating dataValue:', dataValue);
                    const regex = new RegExp(trackedEntityInstance + ';', 'g');
                    dataValue.value = dataValue.value.replace(regex, ''); // replace value
                    console.log('Updated dataValue:', dataValue);
                }
            });
    
            // Prepare the data for the update
            const updateData = UpdateEvent(
                defCourseProgramId,
                defCourseProgramStageId,
                defCourseOrgUnitId,
                eventID,
                updatedEventsTmp.dataValues,
                tei_id
            )
            console.log('Update data prepared:', updateData);
            console.log('Before',dataSCD)
            // Update the event
            console.log('Updating event');
            await engine.mutate(updateData)
            console.log('Event updated');
        } catch(error)
        {
            console.error('An error occurred:', error);
        }
    
        console.log('Updating refresh key');
        setRefreshKey(prevKey => prevKey + 1);
        console.log('Refetching queries');
        await refetchQry();
        console.log('Refetched query');
        await refetchSCD();
        console.log('Refetched SCD');
        await refetchEvent();
        console.log('Refetched event');
        onDelete();
    };
    
    useEffect(() => {
        if (dataSCD) {
            setEventIds(dataSCD.events.events);
        }
    }, [dataSCD,refreshKey]);
    
    useEffect(() => {
        //console.log('eventIds:', eventIds);
        if (eventIds.length > 0) {
            setCurrentEventId(eventIds[0].event);
        }
    }, [eventIds, refreshKey]);
    
    const { loading: loadingEvent, error: errorEvent, data: dataEvent, refetch: refetchEvent } = useDataQuery(eventQuery(currentEventId), {
        skip: !currentEventId,
    })
    
    useEffect(() => {
        setRefreshKey(prevKey => prevKey + 1);
        refetchQry();
        refetchSCD();
        refetchEvent();
        
    }, [refreshCount]);

    return (
        <div> 

            {
                // display that the data is being loaded
                // when loading is true
                loadingQry && 'Loading...'
            }

            {
                // display the error message
                // is an error occurred
                errorQry && error.message
                
            }

            {
                // if there is any data available
                dataQry?.instances?.trackedEntityInstances && (
                    
                    <Table>
      <TableHead>
        <TableRowHead>
          <TableCellHead>Family Name</TableCellHead>
          <TableCellHead>First Name</TableCellHead>
          <TableCellHead>Gender</TableCellHead>
          <TableCellHead>Date of Birth</TableCellHead>
          <TableCellHead>Age</TableCellHead>
          <TableCellHead>View</TableCellHead>
          <TableCellHead colSpan='3' style={{ textAlign: 'center' }} >Course Information</TableCellHead>
          {/* <TableCellHead>ParentRefresh {refreshCount} - {refreshKey}</TableCellHead> */}
        </TableRowHead>
      </TableHead>
      <TableBody>
      {dataQry.instances.trackedEntityInstances
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
                    matchingEventValue = matchingEvent.event; // Store the event value in the variable
                } 
            }

            // Check if trackedEntityInstance is in delTEIs
            if (delTEIs.includes(trackedEntityInstance)) {
                // If it is, return null to not render this row
                return null;
            }

            return (
                <TableRow key={trackedEntityInstance}>
                    {/* <TableCell>{trackedEntityInstance}</TableCell> */}
                    <TableCell>{attributesObj['Family Name']}</TableCell>
                    <TableCell>{attributesObj['First Name']}</TableCell>
                    <TableCell>{attributesObj['Gender']}</TableCell>
                    <TableCell>{attributesObj['Date of Birth']}</TableCell>
                    <TableCell>{attributesObj['Age']}</TableCell>
                    <TableCell >
                        <Link to={`/staffview/${trackedEntityInstance}`}><IconView24 /> </Link>
                    </TableCell>
                    {/* <TableCell>{matchingEventValue}</TableCell> */}
                    <TableCell>
                        
                        <CourseDateAttendeesStaffCustomFields eventID={matchingEventValue}/>
                        
                    </TableCell>
                    <TableCell>
                        <div onClick={() => handleDelete(trackedEntityInstance,matchingEventValue)}><IconDelete24 /></div>
                    </TableCell>
                </TableRow>
            );
        }
    )}
    </TableBody>
    </Table>
                )
            }
        </div>
    )
}
            
