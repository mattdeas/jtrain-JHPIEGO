import { useDataQuery,useDataMutation, useDataEngine } from '@dhis2/app-runtime'
import React, { useState, useEffect } from 'react'
import { CourseDateAttendeesStaffCustomFields } from './CourseDateAttendees-Staff-CustomFields';
import { utilGetConstantValueByName } from '../utils/utils';
import { Table, TableBody, TableCell, TableCellHead, TableHead, TableRow, TableRowHead, IconView24, IconDelete24 } from '@dhis2/ui';
import { Link } from 'react-router-dom';

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
    const [searchQuery, setSearchQuery] = useState('');

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

    const { loading: loadingSCD, error: errorSCD, data: dataSCD, refetch: refetchSCD } = useDataQuery(qryStaffCourseDetails, {
        variables: {
            ou: defCourseOrgUnitId,
            program: defStaffProgram,
            filterEventDE: defCourseEventId,
            EventDE: eventID,
            refreshKey,
        },
    });

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


    return (
        <div>
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
                                    <TableCellHead>Last Name</TableCellHead>
                                    <TableCellHead>First Name</TableCellHead>
                                    <TableCellHead>Mobile #</TableCellHead>
                                    <TableCellHead>Designation</TableCellHead>
                                    <TableCellHead>Location</TableCellHead>
                                    <TableCellHead>View</TableCellHead>
                                    <TableCellHead colSpan='3' style={{ textAlign: 'center' }}>Course Information</TableCellHead>
                                </TableRowHead>
                            </TableHead>
                            <TableBody>
                                {filteredInstances
                                    .slice(0, 10)
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
                                                <TableCell>{attributesObj['Last Name']}</TableCell>
                                                <TableCell>{attributesObj['First Name']}</TableCell>
                                                <TableCell>{attributesObj['Mobile #']}</TableCell>
                                                <TableCell>{attributesObj['Designation']}</TableCell>
                                                <TableCell>
                                                  <Link to={`/staffview/${trackedEntityInstance}`}><IconView24 /></Link>
                                                </TableCell>
                                                <TableCell>
                                                     <CourseDateAttendeesStaffCustomFields eventID={matchingEventValue} />
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
            
