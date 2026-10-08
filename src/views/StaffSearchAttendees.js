import { useDataQuery,useDataMutation, useDataEngine } from '@dhis2/app-runtime'
import {
    Table,
    TableBody,
    TableCell,
    TableCellHead,
    TableHead,
    TableRow,
    TableRowHead,
    IconAddCircle24,
    IconView24,
    CircularLoader,
    Pagination,
} from '@dhis2/ui'
import React, { useState, useEffect } from 'react'
import { Link, BrowserRouter, Switch, Route } from 'react-router-dom'
import { utilConfigConstantValueByName } from '../utils/utils';

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

const itemsPerPage = 10; // unused

// const query = {
//     instances: {
//         resource: 'trackedEntityInstances',
//         params: ({ ou ,trackedEntityType }) => ({
//             ou : ou,
//             trackedEntityType : trackedEntityType,
//         }),
//     },
// }

// Paged trainee search. wXRW65yTN1d = Last Name, Lez2r3d0oxb = First Name (hardcoded attribute IDs).
const query = {
    instances: {
        resource: 'trackedEntityInstances',
        params: ({ ou, trackedEntityType, page, pageSize, searchLastName, searchFirstName }) => {
            const filters = [];
            if (searchLastName) {
                filters.push(`wXRW65yTN1d:like:${searchLastName}`);
            }
            if (searchFirstName) {
                filters.push(`Lez2r3d0oxb:like:${searchFirstName}`);
            }
            return {
                ou: ou,
                trackedEntityType: trackedEntityType,
                fields: [
                    'trackedEntityInstance',
                    'orgUnits[id,displayName]',
                    'attributes[attribute,code,displayName,value]',
                    'enrollments[enrollment,program,orgUnit,enrollmentDate,incidentDate,status,attributes[attribute,code,displayName,value]]',
                    'created',
                    'lastUpdated',
                    'orgUnits[id,displayName]',
                    '*',
                ],
                page: page,
                pageSize: pageSize,
                totalPages: true, // Return pager info for the Pagination control
                order: 'wXRW65yTN1d:asc,Lez2r3d0oxb:desc', //LastName , FirstName SL
                filter: filters,
            };
        },
    },
};
// SHELVED TILL RELATIONSHIP BUG IS CLEARED
// const mutationRelationships = {
//     resource: 'relationships',
//     type: 'create',
//     data: ({ trackedEntityInstance, eventID, type }) => ({
//         relationshipType: type,
//         from: {
//             event: {
//                 event: eventID,
//             },
//         },
//         to: {
//             trackedEntityInstance: {
//                 trackedEntityInstance: trackedEntityInstance,
//             },
//         },
        
//     }),
// };
/**
 * StaffSearchAttendees
 * "Search Trainee to Enroll" panel on a course date: type-ahead name search with paging,
 * and an add button that enrols the trainee.
 *
 * Enrolling a trainee:
 *  1. Appends their TEI ID to the course event's attendee list and increments the count
 *  2. Creates a Staff program event for the trainee linking back to the course event
 *     (CourseEventId) with pre/post scores initialised to 0
 *
 * Props:
 *  - eventID      : course date event ID
 *  - tei_id       : current ';'-separated attendee list (used to mark already-enrolled trainees)
 *  - tei_count    : current attendee count
 *  - onAssign()   : called after enrolling so the parent refreshes
 *  - refreshCount : change to force a refetch
 *  - dataEvent, dElements : passed in but not used here
 */
export const StaffSearchAttendees = ({eventID, dataEvent, tei_id, tei_count, dElements, onAssign, refreshCount}) => {

    const [isLoading, setIsLoading] = useState(false);
    
    const defStaffProgramId = utilConfigConstantValueByName('StaffProgram');
    const defStaffProgramCourseId = utilConfigConstantValueByName('StaffProgramCourse');
    const defStaffOrgUnitId = utilConfigConstantValueByName('DefaultStaffOrgUnit');
    const defStaffTEIType = utilConfigConstantValueByName('TEITypeStaff');
    const defCourseEventId = utilConfigConstantValueByName('CourseEventId');
    const defCourseAttendeesDE = utilConfigConstantValueByName('CourseAttendees');
    const defCourseAttendeesCountDE = utilConfigConstantValueByName('CourseAttendeesCount');
    const defCoursePreScore = utilConfigConstantValueByName('CoursePreTestScore');
    const defCoursePostScore = utilConfigConstantValueByName('CoursePostTestScore');
    const defCourseProgramId = utilConfigConstantValueByName('CourseProgram');
    // Note: the settings key is 'CourseProgramStageId', so this is null and the course event update sends no programStage
    const defCourseProgramStageId = utilConfigConstantValueByName('CourseProgramStage');

    const [page, setPage] = useState(1); // Current page
    const [pageSize, setPageSize] = useState(10); // Items per page
    // What's typed in the boxes vs. the debounced values actually sent to the API
    const [lastNameInput, setLastNameInput] = useState('');
    const [firstNameInput, setFirstNameInput] = useState('');
    const [searchLastName, setLastName] = useState('');
    const [searchFirstName, setFirstName] = useState('');
    const [assignedPerson, setAssignedPerson] = useState(null);

    const { loading, error, data, refetch } = useDataQuery(query, { lazy: true });

    // Auto-search: wait for a pause in typing, and only search once 2+ characters are entered (or the box is cleared)
    const MIN_SEARCH_CHARS = 2;
    useEffect(() => {
        const timer = setTimeout(() => {
            const last = lastNameInput.trim();
            const first = firstNameInput.trim();
            if (last.length > 0 && last.length < MIN_SEARCH_CHARS) return;
            if (first.length > 0 && first.length < MIN_SEARCH_CHARS) return;
            setLastName(last);
            setFirstName(first);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [lastNameInput, firstNameInput]);

    // Fetch whenever the search, page or page size changes, or the parent asks for a refresh
    useEffect(() => {
        refetch({
            ou: defStaffOrgUnitId,
            trackedEntityType: defStaffTEIType,
            page,
            pageSize,
            searchLastName,
            searchFirstName,
        });
    }, [page, pageSize, searchLastName, searchFirstName, refreshCount]);

    const pager = data?.instances?.pager;

    // Today as YYYY-MM-DD - used as the trainee event date
    const today = new Date();
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Unused - superseded by CreateEvent below (handleAssign uses engine.mutate)
    const mutation = {
        resource: 'events',
        type: 'create',
        data: ({ trackedEntityInstance }) => ({
            events: [
                {
                    trackedEntityInstance,
                    program: defStaffProgramId,
                    programStage: defStaffProgramCourseId,
                    //enrollment: 'qIuyPn7AVu2',
                    orgUnit: defStaffOrgUnitId,
                    dataValues: [
                        {
                            dataElement: defCourseEventId,
                            value: eventID,
                        },
                        {
                            dataElement: defCoursePreScore,
                            value: 0,
                        },
                        {
                            dataElement: defCoursePostScore,
                            value: 0,
                        },
                    ],
                    status: 'ACTIVE',
                    eventDate: formattedDate,
                },
            ],
        }),
    };



    const [mutate, { loading: mutationLoading, error: mutationError }] = useDataMutation(mutation);

    //const [mutateRelationships, { loading: mutationRelationshipsLoading, error: mutationRelationshipsError }] = useDataMutation(mutationRelationships);

    // Mutation builder: update the course event's data values
    const UpdateEvent = (program, programStage, orgUnit, event, dataValues, trackedEntityInstance) => ({
        resource: 'events',
        type: 'update',
        trackedEntityInstance,
        id: eventID,
        data: {
            event,
            program,
            programStage,
            orgUnit,
            dataValues,
        },
      });

    // Mutation builder: create the trainee's (completed) Staff program event for this course
    const CreateEvent = (program, programStage, orgUnit, dataValues, trackedEntityInstance) => ({
        resource: 'events',
        type: 'create',
        trackedEntityInstance,
        eventDate: formattedDate,
        data: {
          
          program,
          programStage,
          orgUnit,
          eventDate: formattedDate,
          status: 'COMPLETED',
          dataValues,
          trackedEntityInstance,
        },
      });

      const engine = useDataEngine();

      // Current data values of the course event (so the update doesn't drop other fields)
      const fetchEvent = async (eventID) => {
        const query = {
          events: {
            resource: 'events',
            id: eventID,
            params: {
              fields: ['event', 'dataValues[dataElement,value]'],
            },
          },
        };
      
        const { events } = await engine.query(query);
      
        const dataValues = [];
        events.dataValues.forEach(item => {
          dataValues.push({ dataElement: item.dataElement, value: item.value });
        });
      
        return dataValues;
      };

      
    // Caused by DHIS2 API version structure - caters for 2.40.3 and lower
    const getAttributes = (instance) => {
        // Check if attributes are at the root level
        if (instance.attributes && instance.attributes.length > 0) {
            return instance.attributes;
        }
        // Check if attributes are within enrollments
        if (instance.enrollments && instance.enrollments.length > 0) {
            return instance.enrollments[0].attributes;
        }
        return [];
    };

    // Enrol a trainee on this course date (see component header for the two writes involved)
    const handleAssign = async (trackedEntityInstance) => {
        const dataValues = await fetchEvent(eventID);

        setIsLoading(true);

        // try {
        //     // Perform the assign action here
        //     // For example, you might call a mutation or an API
        // } catch (error) {
        //     console.error(error);
        // } finally {
            
        // }

        // Copy the course event's values, appending this TEI to the attendee list and bumping the count
        const dataInputs = [];
        dataValues.forEach(item => {
            let value;
            switch (item.dataElement) {
                case defCourseAttendeesDE:
                    value = (tei_id || '') + trackedEntityInstance + ';';
                    break;
                case defCourseAttendeesCountDE:
                    value = tei_count + 1;
                    break;
                default:
                    value = item.value;
                    break;
            }
            dataInputs.push({ dataElement: item.dataElement, value: value });


            
        });

        // First attendee: the event has no attendee list value yet, so add one
        const HasAttendees = dataInputs.some(item => item.dataElement === defCourseAttendeesDE);
        if (!HasAttendees) {
            dataInputs.push({ dataElement: defCourseAttendeesDE, value: (tei_id || '') + trackedEntityInstance + ';' });
        }




   const myMutation = UpdateEvent(defCourseProgramId, defCourseProgramStageId, defStaffOrgUnitId, eventID, dataInputs);
   await engine.mutate(myMutation);

     // Trainee event values: link to the course event, scores start at 0
     const dataStaffDefault = [];
     dataStaffDefault.push({ dataElement: defCourseEventId, value: eventID });
     dataStaffDefault.push({ dataElement: defCoursePreScore, value: 0 });
     dataStaffDefault.push({ dataElement: defCoursePostScore, value: 0 });

     console.log('=== ENROLLMENT LOG ===');
     console.log('defStaffProgramId:', defStaffProgramId);
     console.log('defStaffProgramCourseId:', defStaffProgramCourseId);
     console.log('defStaffOrgUnitId:', defStaffOrgUnitId);
     console.log('dataStaffDefault:', dataStaffDefault);
     console.log('trackedEntityInstance:', trackedEntityInstance);
     console.log('=== END ENROLLMENT LOG ===');
     const myStaffUpdate = CreateEvent(defStaffProgramId, defStaffProgramCourseId, defStaffOrgUnitId, dataStaffDefault, trackedEntityInstance);
     try {
            const response2 = await engine.mutate(myStaffUpdate);
            console.log('Mutation completed', response2);
            
            // Add a delay before calling onAssign and refetch (gives DHIS2 time to index the new data)
            setTimeout(() => {
                console.log('Calling onAssign');
                onAssign(); // Ensure this is called
                refetch();
            }, 1000); // Delay of 1 second
        } catch (error) {
            console.error('An error occurred:', error);
        }
        setIsLoading(false);
    }
    
    
    return (
        
        <div> 
         {isLoading ? <CircularLoader small /> : <div>
            <h3>Search Trainee to Enroll </h3>

{/* Inputs stay mounted while results load so typing isn't interrupted */}
<div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
    <input
        type="text"
        onChange={(e) => setLastNameInput(e.target.value)}
        value={lastNameInput}
        placeholder="Last Name"
    />
    <input
        type="text"
        value={firstNameInput}
        onChange={(e) => setFirstNameInput(e.target.value)}
        placeholder="First Name"
    />
    {loading && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <CircularLoader small />
            <span>Searching...</span>
        </span>
    )}
</div>
{assignedPerson && <p>{assignedPerson} was added.</p>}

{error && error.message}

{
    // if there is any data available
    data?.instances?.trackedEntityInstances && (
        <div>
        <Table>
<TableHead>
<TableRowHead>
<TableCellHead>Last Name</TableCellHead>
<TableCellHead>First Name</TableCellHead>
<TableCellHead>Cadre</TableCellHead>
<TableCellHead>Mobile #</TableCellHead>
<TableCellHead>Open</TableCellHead>
<TableCellHead>Enroll</TableCellHead>
</TableRowHead>
</TableHead>
<TableBody>
{data.instances.trackedEntityInstances.length === 0 && (
    <TableRow>
        <TableCell colSpan="6">No trainees found</TableCell>
    </TableRow>
)}
{data.instances.trackedEntityInstances
    .map(item => {
        const attributes = getAttributes(item);
        // Already-enrolled trainees are shown (not filtered out) so server-side pages stay a consistent size
        const isEnrolled = !!(tei_id && tei_id.includes(item.trackedEntityInstance));
        // Create an object from the attributes array
        const attributesObj = attributes.reduce((obj, item) => {
            obj[item.displayName] = item.value;
            return obj;
        }, {});

        return (
            <TableRow key={item.trackedEntityInstance}>
                {/* <!-- This area needs to be dynamic --> */}
                <TableCell>{attributesObj['Last Name']}</TableCell>
                <TableCell>{attributesObj['First Name']}</TableCell>
                <TableCell>{attributesObj['Cadre']}</TableCell>
                <TableCell>{attributesObj['Mobile #']}</TableCell>
                <TableCell>
                    <a href={`/staffview/${item.trackedEntityInstance}`} target="_blank" rel="noopener noreferrer"><IconView24 /></a>
                </TableCell>
                {/* <TableCell>{item.trackedEntityInstance}</TableCell> */}
                <TableCell align="left">
                    {isEnrolled ? (
                        <span>Enrolled</span>
                    ) : (
                        <div style={{ cursor: 'pointer' }} onClick={() => {
                            handleAssign(item.trackedEntityInstance);
                            setAssignedPerson(`${attributesObj['First Name']} ${attributesObj['Last Name']}`);
                        }}>
                            <IconAddCircle24 />
                        </div>
                    )}
                </TableCell>
            </TableRow>
        );
    })}
            </TableBody>
</Table>
{pager && pager.pageCount > 0 && (
    <Pagination
        page={pager.page}
        pageCount={pager.pageCount}
        pageSize={pager.pageSize}
        total={pager.total}
        pageSizes={['10', '25', '50']}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(Number(size)); setPage(1); }}
    />
)}
</div>
    )
}
         </div>}
            
        </div>
    )
}
            
