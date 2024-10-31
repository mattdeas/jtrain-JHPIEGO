import { useDataQuery,useDataMutation, useDataEngine } from '@dhis2/app-runtime'
import React, { useState, useEffect } from 'react'
import { CourseDateAttendeesStaffCustomFields } from './CourseDateAttendees-Staff-CustomFields';
import { utilConfigConstantValueByName } from '../utils/utils';
import { Table, TableBody, TableCell, TableCellHead, TableHead, TableRow, TableRowHead, IconView24, IconDelete24 } from '@dhis2/ui';
import { Link } from 'react-router-dom';
import { IconFileDocument24, IconSubtractCircle16 } from '@dhis2/ui';

const ORG_UNITS_QUERY = {
    orgUnits: {
        resource: 'organisationUnits',
        params: {
            paging: false,
        },
    },
};

const query = {
    instances: {
        resource: 'trackedEntityInstances',
        params: ({ ou, trackedEntityType, tei_id }) => ({
            ou: ou,
            trackedEntityType: trackedEntityType,
            trackedEntityInstance: tei_id,
            paging: false,
            pageSize: 1000,
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
            paging: false,
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
    const [searchQuery, setSearchQuery] = useState('');
    const [isFileIconVisible, setIsFileIconVisible] = useState(true);

    const defStaffEntityType = utilConfigConstantValueByName('TEITypeStaff');
    const defStaffOrgUnit = utilConfigConstantValueByName('DefaultStaffOrgUnit');
    const defCourseOrgUnitId = utilConfigConstantValueByName('DefaultCourseOrgUnit');
    const defCourseEventId = utilConfigConstantValueByName('CourseEventId');
    const defStaffProgram = utilConfigConstantValueByName('StaffProgram');
    console.log('defStaffProgram', defStaffProgram);
    const { loading: loadingQry, error: errorQry, data: dataQry, refetch: refetchQry } = useDataQuery(query, {
        variables: {
            ou: defStaffOrgUnit,
            trackedEntityType: defStaffEntityType,
            tei_id: tei_id,
            refreshKey,
            lazy: true,
            
        },
    });

    const { loading: loadingSCD, error: errorSCD, data: dataSCD, refetch: refetchSCD } = useDataQuery(qryStaffCourseDetails, {
        variables: {
            ou: defCourseOrgUnitId,
            program: defStaffProgram,
            filterEventDE: defCourseEventId,
            EventDE: eventID,
            refreshKey,
        },
    });

    const handleDivClick = (trackedEntityInstance) => {
        if (!showCustomFields[trackedEntityInstance]) {
            handleShowCustomFields(trackedEntityInstance);
        }
    };
    const { loading: orgUnitsLoading, error: orgUnitsError, data: orgUnitsData } = useDataQuery(ORG_UNITS_QUERY);

    useEffect(() => {
        setRefreshKey(prevKey => prevKey + 1);
        refetchQry();
        refetchSCD();
    }, [dataQry, dataSCD, refetchQry, refetchSCD, reload, refreshCount]);

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
        refetchQry();
        refetchSCD();
        refetchEvent();
    }, [refreshCount]);

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const filteredInstances = dataQry?.instances?.trackedEntityInstances.filter(({ attributes }) => {
        const attributesObj = attributes.reduce((obj, item) => {
            obj[item.displayName] = item.value;
            return obj;
        }, {});

        return Object.values(attributesObj).some(value =>
            value.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    const [showCustomFields, setShowCustomFields] = useState({});

    const handleShowCustomFields = (trackedEntityInstance) => {
        setShowCustomFields(prevState => ({
            ...prevState,
            [trackedEntityInstance]: !prevState[trackedEntityInstance]
        }));
    };

    const handleToggleTestSection = () => {
        setShowTestSection(prevState => !prevState);
        console.log('Toggled test section');
    };

    const handleDelete = async (trackedEntityInstance, MaineventID) => {
        console.log(`Deleting tracked entity instance: ${trackedEntityInstance} with event ID: ${MaineventID}`);

        const deleteMutation = {
            resource: `events/${MaineventID}`,
            type: 'delete',
        };

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
                // Perform the delete
                //await engine.mutate(deleteMutation);

                //alert('Event deleted successfully');
                // Add any additional logic here, such as updating the state or refetching data
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
                .table-container {
                    max-height: 400px; /* Adjust the height as needed */
                    overflow-y: auto;
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
            {loadingQry && 'Loading...'}
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
                            {/* Add content for the right div here */}
                            Total # Attendees {dataQry?.instances?.trackedEntityInstances.length}
                        </div>
                    </div>
                    <div className="table-container">
                        <Table>
                            <TableHead className="sticky-header">
                                <TableRowHead>
                                    {/* <TableCellHead>ID</TableCellHead> */}
                                    <TableCellHead>Last Name</TableCellHead>
                                    <TableCellHead>First Name</TableCellHead>
                                    <TableCellHead>Designation</TableCellHead>
                                    <TableCellHead>View Enrollee</TableCellHead>
                                    <TableCellHead>View Details</TableCellHead>
                                    <TableCellHead colSpan='3' style={{ textAlign: 'center' }}>Delete</TableCellHead>
                                </TableRowHead>
                            </TableHead>
                            <TableBody>
                                {filteredInstances
                                    .slice(0, 10000)
                                    .map(({ trackedEntityInstance, attributes }) => {
                                        const attributesObj = attributes.reduce((obj, item) => {
                                            obj[item.displayName] = item.value;
                                            return obj;
                                        }, {});
    
                                        let matchingEventValue = null;
                                        if (dataSCD) {
                                            const matchingEvent = dataSCD.events.events.find(event => event.trackedEntityInstance === trackedEntityInstance);
                                            if (matchingEvent) {
                                                matchingEventValue = matchingEvent.event;
                                            }
                                        }
    
                                        if (delTEIs.includes(trackedEntityInstance)) {
                                            return null;
                                        }
    
                                        return (
                                            <TableRow key={trackedEntityInstance}>
                                                {/* <TableCell>{trackedEntityInstance}</TableCell> */}
                                                <TableCell>{attributesObj['Last Name']}</TableCell>
                                                <TableCell>{attributesObj['First Name']}</TableCell>
                                                <TableCell>{attributesObj['Designation']}</TableCell>
                                                <TableCell>
                                                  <Link to={`/staffview/${trackedEntityInstance}`}><IconView24 alt="View Enrollee Details" /></Link>
                                                </TableCell>
                                                <TableCell >
                                                <div>
                                                {isFileIconVisible ? (
                <div onClick={() => { 
                    console.log('IconFileDocument24 clicked');
                    setIsFileIconVisible(false);
                    handleShowCustomFields(trackedEntityInstance); 
                }} style={{ display: 'inline-block', cursor: 'pointer' }}>
                    <IconFileDocument24 />
                </div>
            ) : (
                <div onClick={() => { 
                    console.log('IconSubtractCircle16 clicked');
                    setIsFileIconVisible(true);
                    handleShowCustomFields(trackedEntityInstance); 
                }} style={{ display: 'inline-block', cursor: 'pointer' }}>
                    <IconSubtractCircle16 />
                </div>
            )}

            {showCustomFields[trackedEntityInstance] && (
                <CourseDateAttendeesStaffCustomFields eventID={matchingEventValue} />
            )}
            </div>
            
                                                 </TableCell>
                                                 <TableCell>
                                                     <div onClick={() => handleDelete(trackedEntityInstance, matchingEventValue)}><IconDelete24 /></div>
                                                 </TableCell>
                                                {/* Additional cells for Course Information */}
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
            
