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

// No-op debounced resize handler (placeholder)
const handleResize = debounce(() => {
}, 200);

window.addEventListener('resize', handleResize);


// All org units (loaded but not currently used in the output)
const ORG_UNITS_QUERY = {
    orgUnits: {
        resource: 'organisationUnits',
        params: {
            paging: false,
        },
    },
};


// Trainee (Staff program) events linked to a course date via the CourseEventId data element
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


/**
 * CourseDateStaffShow
 * Used on the Course view page when a course date is selected. Currently it just renders
 * the "Course Details" summary (CourseDetailsCourseView) for that date; the trainee and
 * trainee-event queries below are loaded but not displayed.
 * Props: tei_id - course TEI ID; eventID - course date event ID; refreshCount - bump to refetch.
 */
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
    

    // Refetch when the parent signals a change
    useEffect(() => {
        refetch();
        refetchdataSCD();
    }, [refreshCount]);

    useEffect(() => {
        // This code will run whenever `reload` changes
        // Add your code here
    }, [reload]);
  
    
    // All trainee TEIs in the staff org unit
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

    // Builds an event update mutation
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

    // Unused and incomplete: engine and the def* IDs it references aren't defined in this file.
    // See StaffShow (CourseDateAttendees-StaffShow.js) for the working remove-attendee logic.
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
    
    // Track the linked trainee events, and the first one as "current"
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
                loading && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <CircularLoader small />
                        <span>Loading...</span>
                    </div>
                )
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
      
    </Table>
                )
            }
        </div>
    )
}
            
