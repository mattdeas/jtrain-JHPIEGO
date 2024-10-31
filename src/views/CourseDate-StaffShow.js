import { useDataQuery,useDataMutation } from '@dhis2/app-runtime'
import { CircularLoader, IconView16, IconView24,
    IconDelete16,
    IconDelete24,
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
import { utilConfigConstantValueByName } from '../utils/utils';
import { CourseDateAttendeesStaffCustomFields } from './CourseDateAttendees-Staff-CustomFields';
import { CourseDetailsCourseView } from './CourseDetailsCourseView';
import { StaffShow } from './CourseDateAttendees-StaffShow';


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


const ORG_UNITS_QUERY = {
    orgUnits: {
        resource: 'organisationUnits',
        params: {
            paging: false,
        },
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
}


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


export const CourseDateStaffShow = ({tei_id, eventID, reload, refreshCount}) => {
    const [eventIds, setEventIds] = useState([]);
    const [currentEventId, setCurrentEventId] = useState(null);
    const [eventData, setEventData] = useState([]);
    const [deleteEvent] = useDataMutation(deleteMutation);
    const [updateEvent] = useDataMutation(updateMutation);

    const defStaffTEI = utilConfigConstantValueByName('TEITypeStaff')
    
    const defStaffOrg = utilConfigConstantValueByName('DefaultStaffOrgUnit')

    const defStaffProgram = utilConfigConstantValueByName('StaffProgram')
    const defStaffCourseDE = utilConfigConstantValueByName('CourseEventId')
    

    useEffect(() => {
        refetch();
        refetchdataSCD();
    }, [refreshCount]);

    useEffect(() => {
        // This code will run whenever `reload` changes
        // Add your code here
    }, [reload]);
  
    
    const query = {  
            instances: {
                resource: 'trackedEntityInstances',
                params: () => ({
                    ou : defStaffOrg,
                    trackedEntityType : defStaffTEI,
                    refreshCount
            }),
        },
    }
    const { loading, error, data, refetch} = useDataQuery(query);
    const { loading: loadingSCD, error: errorSCD, data: dataSCD, refetch: refetchdataSCD } = useDataQuery(qryStaffCourseDetails, {
        variables: {
            ou: defStaffOrg,
            program: defStaffProgram,
            filterEventDE: defStaffCourseDE,
            EventDE: eventID,
        },
    });

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

      
    const { loading: orgUnitsLoading, error: orgUnitsError, data: orgUnitsData } = useDataQuery(ORG_UNITS_QUERY);

    const handleDelete = async (trackedEntityInstance) => {
        // Delete the event
        console.log('handleDeleteeventID:', eventID);
        console.log('handleDeletetrackedEntityInstance:', trackedEntityInstance);
        await deleteEvent({ id: eventID });
        
    
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

        const { events: updatedEventsTmp } = await engine.query(query)
        console.log('updatedEventsTMP',updatedEventsTmp)

        // Prepare the data for the update
        updatedEventsTmp.dataValues.forEach(dataValue => {
            if (dataValue.dataElement === defCourseAttendeesCountDEId) {
                dataValue.value = parseInt(dataValue.value) - 1; // subtract 1
            } else if (dataValue.dataElement === defCourseAttendeesId) {
                const regex = new RegExp(trackedEntityInstance + ';', 'g');
                dataValue.value = dataValue.value.replace(regex, ''); // replace value
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

        // Update the event
        await engine.mutate(updateData)
    
        // Re-upload the modified data
        //await updateEvent({ id: eventID, data: { dataValues } });
        refreshCount = refreshCount + 1;
        refetch();
        refetchdataSCD();
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
    
    
// const { loading: loadingEvent, error: errorEvent, data: dataEvent } = useDataQuery(eventQuery(eventID), {
//     skip: !currentEventId,
// });


   
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
      <TableRow>
      <div>
            <TableCellHead style={{ display: 'flex', flexDirection: 'column', width: '80vw', margin: 0, padding: 0 }}>Course Details: </TableCellHead>
            <CourseDetailsCourseView id={eventID} /> 
      </div>
      </TableRow>
       <TableRow>
            {/* <button onClick={() => refetch()}>Edit Course Information</button> */}
       </TableRow>
      {/* <TableBody>
      {data.instances.trackedEntityInstances
    .slice(0, 1000)
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
                console.log('matchingEvent', matchingEvent)
                if (matchingEvent) {
                    matchingEventValue = matchingEvent.event; // Store the event value in the variable
                } else {
                }
            }

            if(matchingEventValue != null)
            {
            return (

                <TableRow key={trackedEntityInstance}>
                    <TableCell>{attributesObj['Last Name']}</TableCell>
                    <TableCell>{attributesObj['First Name']}</TableCell>
                    <TableCell>{attributesObj['Designation']}</TableCell>
                    <TableCell>{
                        (attributesObj['Location'])                    

            .toString()
            .split('/')
            .slice(2)
            .map(id => {
                const orgUnit = orgUnitsData.orgUnits.organisationUnits.find(orgUnit => orgUnit.id === id);
                return orgUnit ? orgUnit.displayName : id;
            })
            .join(' - ')

                        
                        }</TableCell>
                    <TableCell >
                        <Link to={`/staffview/${trackedEntityInstance}`}><IconView24 alt="View Staff Details"/></Link>
                    </TableCell>
                    <TableCell>
                        
                        <CourseDateAttendeesStaffCustomFields eventID={matchingEventValue}/>
                        
                    </TableCell>
                    <TableCell>
                        <div title="Delete Attendee from this course?" onClick={() => handleDelete(trackedEntityInstance)} ><IconDelete24 /></div>
                    </TableCell>
                </TableRow>
            );
            }
        }
    )}
                        </TableBody> */}
    </Table>
                )
            }
        </div>
    )
}
            
