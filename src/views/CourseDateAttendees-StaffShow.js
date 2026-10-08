import { useDataQuery,useDataMutation, useDataEngine } from '@dhis2/app-runtime'
import React, { useState, useEffect } from 'react'
import { CourseDateAttendeesStaffCustomFields } from './CourseDateAttendees-Staff-CustomFields';
import { utilConfigConstantValueByName } from '../utils/utils';
import { Table, TableBody, TableCell, TableCellHead, TableHead, TableRow, TableRowHead, IconView24, IconDelete24, CircularLoader } from '@dhis2/ui';
import { Link } from 'react-router-dom';
import { IconFileDocument24, IconSubtractCircle16 } from '@dhis2/ui';

/**
 * StaffShow
 * The "Course Attendees" list for a course date: one row per enrolled trainee with links
 * to their record, an inline editor for their attendance details (scores etc.), and a
 * remove button. Includes a free-text filter across all trainee attributes.
 *
 * Props:
 *  - tei_id       : ';'-separated attendee TEI IDs from the course event (e.g. "abc;def;")
 *  - eventID      : course date event ID
 *  - reload / refreshCount : change to force a refetch
 *  - onRemove()   : called after an attendee is removed so the parent can refresh
 */

// All org units (unused here)
const ORG_UNITS_QUERY = {
    orgUnits: {
        resource: 'organisationUnits',
        params: {
            paging: false,
        },
    },
};

// const query = {
//     instances: {
//         resource: 'trackedEntityInstances',
//         params: ({ ou, trackedEntityType, tei_id }) => ({
//             ou: ou,
//             trackedEntityType: trackedEntityType,
//             trackedEntityInstance: tei_id,
//             paging: false,
//             pageSize: 1000,
//         }),
//     },
// };

// A single trainee TEI by ID (run once per attendee)
const query = {
    instances: {
        resource: 'trackedEntityInstances',
        params: ({ ou, trackedEntityType, tei_id }) => ({
            ou: ou,
            trackedEntityType: trackedEntityType,
            trackedEntityInstance: tei_id,
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
            paging: false,
            pageSize: 100,
            order: 'wXRW65yTN1d:asc,Lez2r3d0oxb:desc', // LastName, FirstName SL
        }),
    },
};

// Trainee (Staff program) events linked to this course date - used to find each
// attendee's own event for the inline details editor
const qryStaffCourseDetails = {
    events: {
        resource: 'events',
        params: ({ ou, program, filterEventDE, EventDE }) => ({
            ou: ou,
            program: program,
            filter: filterEventDE + ':eq:' + EventDE,
            pageSize: 1000,
            fields: 'event,trackedEntityInstance',
            paging: false,
        }),
    },
};

const eventQuery = (eventID) => ({
    events: {
        resource: `events/${eventID}`,
    },
});

export const StaffShow = ({ tei_id, eventID, reload, refreshCount, onRemove }) => {
    const engine = useDataEngine();
    const [eventIds, setEventIds] = useState([]);
    const [currentEventId, setCurrentEventId] = useState(null);
    const [delTEIs, setDelTEIs] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFileIconVisible, setIsFileIconVisible] = useState(true);
    const [dataQry, setDataQry] = useState(null);
    const [loadingQry, setLoadingQry] = useState(false);
    const [errorQry, setErrorQry] = useState(null);

    const defStaffEntityType = utilConfigConstantValueByName('TEITypeStaff');
    const defStaffOrgUnit = utilConfigConstantValueByName('DefaultStaffOrgUnit');
    const defCourseOrgUnitId = utilConfigConstantValueByName('DefaultCourseOrgUnit');
    const defCourseEventId = utilConfigConstantValueByName('CourseEventId');
    const defStaffProgram = utilConfigConstantValueByName('StaffProgram');
    
    // Fetch every attendee TEI in parallel (tei_id has a trailing ';', hence slice) and merge the results
    const fetchData = async () => {
        setLoadingQry(true);
        setErrorQry(null);
        try {
            const teiIds = tei_id.slice(0, -1).split(';');
            const results = await Promise.all(
                teiIds.map(id =>
                    engine.query(query, {
                        variables: {
                            ou: defStaffOrgUnit,
                            trackedEntityType: defStaffEntityType,
                            tei_id: id,
                            refreshKey,
                        },
                    })
                )
            );
            const combinedData = results.reduce((acc, result) => {
                if (result.instances.trackedEntityInstances) {
                    acc.instances.trackedEntityInstances.push(...result.instances.trackedEntityInstances);
                }
                return acc;
            }, { instances: { trackedEntityInstances: [] } });
            setDataQry(combinedData);
            console.log('combinedData', combinedData);
        } catch (error) {
            setErrorQry(error);
        } finally {
            setLoadingQry(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [refreshKey, reload, refreshCount]);
    

    const { loading: loadingSCD, error: errorSCD, data: dataSCD, refetch: refetchSCD } = useDataQuery(qryStaffCourseDetails, {
        variables: {
            ou: defCourseOrgUnitId,
            program: defStaffProgram,
            filterEventDE: defCourseEventId,
            EventDE: eventID,
            refreshKey,
        },
    });

    // Note: this depends on dataSCD and also refetches it, so every response can trigger another
    // refetch (and another fetchData via refreshKey). Worth checking the network tab for a loop.
    useEffect(() => {
        setRefreshKey(prevKey => prevKey + 1);
        refetchSCD();
    }, [dataSCD, refetchSCD, reload, refreshCount]);

    useEffect(() => {
        if (dataSCD) {
            setEventIds(dataSCD.events.events);
        }
    }, [dataSCD, refreshKey]);

    useEffect(() => {
        if (eventIds.length > 0) {
            setCurrentEventId(eventIds[0].event);
        }
    }, [eventIds, refreshKey]);

    const { loading: loadingEvent, error: errorEvent, data: dataEvent, refetch: refetchEvent } = useDataQuery(eventQuery(currentEventId), {
        skip: !currentEventId,
    });

    useEffect(() => {
        setRefreshKey(prevKey => prevKey + 1);
        refetchSCD();
        refetchEvent();
    }, [refreshCount]);

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
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

    // Free-text filter: keep attendees where any attribute value contains the search text
    const filteredInstances = dataQry?.instances?.trackedEntityInstances.filter((instance) => {
        const attributesObj = getAttributes(instance).reduce((obj, item) => {
            obj[item.displayName] = item.value || '';
            return obj;
        }, {});

        return Object.values(attributesObj).some((value) =>
            String(value).toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    const [showCustomFields, setShowCustomFields] = useState({});

    // Toggle the inline details editor for one attendee
    const handleShowCustomFields = (trackedEntityInstance) => {
        setShowCustomFields(prevState => ({
            ...prevState,
            [trackedEntityInstance]: !prevState[trackedEntityInstance]
        }));
    };

    // Remove an attendee from the course date: take their TEI out of the attendee list and
    // decrement the count on the course event. Note: the trainee's own Staff program event
    // (MaineventID) is left in place.
    const handleDelete = async (trackedEntityInstance, MaineventID) => {
              

        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                // Fetch the event details
                const eventDetails = await engine.query({
                    event: {
                        resource: `events/${eventID}`,
                    },
                });

                const eventData = eventDetails.event;

                // Update the data values
                const defCourseAttendeesCountDE = utilConfigConstantValueByName('CourseAttendeesCount'); 
                const defCourseAttendeesDE =   utilConfigConstantValueByName('CourseAttendees');

                const updatedDataValues = eventData.dataValues.map(dataValue => {
                    if (dataValue.dataElement === defCourseAttendeesCountDE) {
                        return {
                            ...dataValue,
                            value: parseInt(dataValue.value, 10) - 1,
                        };
                    } else if (dataValue.dataElement === defCourseAttendeesDE) {
                        return {
                            ...dataValue,
                            value: dataValue.value.replace(`${trackedEntityInstance};`, ''),
                        };
                    }
                    return dataValue;
                });

                console.log('eventsdata',eventData)
                // Create the update mutation
                const updateMutation = {
                    resource: `events/${eventID}`,
                    type: 'update',
                    data: {
                        ...eventData,
                        dataValues: updatedDataValues,
                    },
                };

                // Perform the update
                await engine.mutate(updateMutation);
                //alert('updated event',eventID)


                //alert('Event deleted successfully');
                // Add any additional logic here, such as updating the state or refetching data
                // Re-fetch the data to refresh the control
                console.log('about to run')
                
                onRemove();

            } catch (error) {
                console.error('Failed to delete event:', error);
                alert('Failed to delete event');
            }
        }
    };

    return (
        <div>
        {/* <IconFileDocument24 onClick={handleToggleTestSection} /> */}
            <style>
                {`
                /* Grows with the attendee count, capped relative to the screen height (min 300px) */
                .attendee-table-container {
                    max-height: max(300px, calc(100vh - 320px));
                    overflow: auto;
                }
    
                .sticky-header th {
                    position: sticky;
                    top: 0;
                    background: white; /* Adjust the background color as needed */
                    z-index: 1;
                }
    
                .flex-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
    
                .left-div {
                    flex: 1;
                }
    
                .right-div {
                    flex: 1;
                    text-align: right;
                }
                `}
            </style>
            {loadingQry && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <CircularLoader small /><span>Loading...</span>
                </div>
            )}
            {/* Note: should be errorQry.message - `error` isn't defined here */}
            {errorQry && error.message}
            {dataQry?.instances?.trackedEntityInstances && (
                <div>
                    <div className="flex-container">
                        <div className="left-div">
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                        </div>
                        <div className="right-div">
                            Total # Attendees {filteredInstances?.length || 0}
                        </div>
                    </div>
                    <div className="attendee-table-container">
                        <Table>
                            <TableHead className="sticky-header">
                                <TableRowHead>
                                    <TableCellHead>Last Name</TableCellHead>
                                    <TableCellHead>First Name</TableCellHead>
                                    <TableCellHead>Cadre</TableCellHead>
                                    <TableCellHead>View Enrollee</TableCellHead>
                                    <TableCellHead>View Details</TableCellHead>
                                    <TableCellHead colSpan='3' style={{ textAlign: 'center' }}>Delete</TableCellHead>
                                </TableRowHead>
                            </TableHead>
                            <TableBody>
                                {/* Sorted by Last Name A-Z, then First Name Z-A (matches the API order used elsewhere) */}
                                {filteredInstances
                                ?.sort((a, b) => {
                                    const getAttr = (tei, name) =>
                                        getAttributes(tei)
                                            .find(attr => attr.displayName === name)?.value?.toLowerCase() || '';

                                    const lastA = getAttr(a, 'Last Name');
                                    const lastB = getAttr(b, 'Last Name');

                                    const firstA = getAttr(a, 'First Name');
                                    const firstB = getAttr(b, 'First Name');

                                    // Last Name ASC
                                    const lastCompare = lastA.localeCompare(lastB);
                                    if (lastCompare !== 0) return lastCompare;

                                    // First Name DESC
                                    return firstB.localeCompare(firstA);
                                })
                                .slice(0, 10000)
                                .map(instance => {
                                        const attributes = getAttributes(instance);
                                        const attributesObj = attributes.reduce((obj, item) => {
                                            obj[item.displayName] = item.value;
                                            return obj;
                                        }, {});

                                        // This attendee's own Staff program event for this course date
                                        let matchingEventValue = null;
                                        if (dataSCD) {
                                            const matchingEvent = dataSCD.events.events.find(event => event.trackedEntityInstance === instance.trackedEntityInstance);
                                            if (matchingEvent) {
                                                matchingEventValue = matchingEvent.event;
                                            }
                                        }

                                        if (delTEIs.includes(instance.trackedEntityInstance)) {
                                            return null;
                                        }

                                        return (
                                            <TableRow key={instance.trackedEntityInstance}>
                                                <TableCell>{attributesObj['Last Name']}</TableCell>
                                                <TableCell>{attributesObj['First Name']}</TableCell>
                                                <TableCell>{attributesObj['Cadre']}</TableCell>
                                                <TableCell>
                                                    <Link to={`/staffview/${instance.trackedEntityInstance}`}><IconView24 alt="View Enrollee Details" /></Link>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        {/* Note: isFileIconVisible is shared by all rows, so the icon flips on every row at once */}
                                                        {isFileIconVisible ? (
                                                            <div onClick={() => {
                                                                console.log('IconFileDocument24 clicked');
                                                                setIsFileIconVisible(false);
                                                                handleShowCustomFields(instance.trackedEntityInstance);
                                                            }} style={{ display: 'inline-block', cursor: 'pointer' }}>
                                                                <IconFileDocument24 />
                                                            </div>
                                                        ) : (
                                                            <div onClick={() => {
                                                                console.log('IconSubtractCircle16 clicked');
                                                                setIsFileIconVisible(true);
                                                                handleShowCustomFields(instance.trackedEntityInstance);
                                                            }} style={{ display: 'inline-block', cursor: 'pointer' }}>
                                                                <IconSubtractCircle16 />
                                                            </div>
                                                        )}

                                                        {showCustomFields[instance.trackedEntityInstance] && (
                                                            <CourseDateAttendeesStaffCustomFields eventID={matchingEventValue} />
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div onClick={() => handleDelete(instance.trackedEntityInstance, matchingEventValue)}><IconDelete24 /></div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
}
            
