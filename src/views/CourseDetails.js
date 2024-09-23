import { useDataQuery } from '@dhis2/app-runtime';
import {
    Table,
    TableBody,
    TableCell,
    TableCellHead,
    TableHead,
    TableRow,
    TableRowHead,
} from '@dhis2/ui';
import React, { useState } from 'react';
import { CourseDateAttendees } from './CourseDateAttendees';
import { utilGetConstantValueByName,  utilConfigConstantValueByName } from '../utils/utils';
import { IconView16, IconView24 } from '@dhis2/ui';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
const ORG_UNITS_QUERY = {
    orgUnits: {
        resource: 'organisationUnits',
        params: {
            paging: false,
        },
    },
};
export const CourseDetails = ({ course, updateHeadings }) => {
    const defCourseProgramId = utilConfigConstantValueByName('CourseProgram');
    const defCourseOrgUnitId = utilConfigConstantValueByName('DefaultCourseOrgUnit');
    const defCourseProgramStageId = utilConfigConstantValueByName('CourseProgramStageId');
    const defCourseDEPartner = utilConfigConstantValueByName('CourseDEPartner');
    const defCourseDEStartDate = utilConfigConstantValueByName('CourseStartDate');
    const defCourseDEEndDate = utilConfigConstantValueByName('CourseEndDate');
    console.log('defCourseProgramStageId', defCourseProgramStageId);
    const { loading: orgUnitsLoading, error: orgUnitsError, data: orgUnitsData } = useDataQuery(ORG_UNITS_QUERY);

    


    const qryProgramDataElements = {
        programStages: {
            resource: `programStages/${defCourseProgramStageId}`,
            params: {
                fields: 'programStageDataElements[sortOrder,dataElement[id,displayName]]',
            },
        },
    };

    const eventQuery = {
        events: {
            resource: 'events',
            params: ({ trackedEntityInstance }) => ({
                program: defCourseProgramId,
                orgUnit: defCourseOrgUnitId,
                trackedEntityInstance,
                fields: 'event,eventDate,dataValues[dataElement,value]',
            }),
        },
    };

    const { loading, error, data, refetch } = useDataQuery(eventQuery, {
        variables: {
            trackedEntityInstance: course.trackedEntityInstance,
        },
    });

    const [selectedRow, setSelectedRow] = useState(null);
    const [showCourseDetails, setShowCourseDetails] = useState(false);
    const [selectedCourseDate, setSelectedCourseDate] = useState('');
    const [showTable, setShowTable] = useState(true);
    const [locationFilter, setLocationFilter] = useState('');
    const [partnerFilter, setPartnerFilter] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);
    const [values, setValues] = useState({ location: '', partner: '' });
    const [filterDate, setFilterDate] = useState('');

    const dProgramDE = useDataQuery(qryProgramDataElements);

    const handleTextChange = (event) => {
        const { name, value } = event.target;
        setValues({
            ...values,
            [name]: value,
        });
        if (name === 'location') {
            setLocationFilter(value);
        } else if (name === 'partner') {
            setPartnerFilter(value);
        }
    };

    const handleFilterCourseDate = (date) => { 
        setFilterDate(date);
    };

    if (dProgramDE.loading || loading) return 'Loading...';
    if (error) return error.message;
    if (!data || !data.events) return 'No data';

    const rows = data.events.events.map(({ event, eventDate, dataValues }) => {
        const row = { event, eventDate };
        dataValues.forEach(({ dataElement, value }) => {
            row[dataElement] = value;
        });
        return row;
    });

    const dataElements = [...new Set(data.events.events.flatMap(({ dataValues }) => dataValues.map(({ dataElement }) => dataElement)))];

    const onButtonClick = (variablesToPassBack) => {
        let variablesString = Object.entries(variablesToPassBack)
            .map(([key, value]) => `${key} - ${value}`)
            .join(' - ');
        updateHeadings(variablesString);
    };


    const filteredRows = rows.filter(row => {
        const partnerMatch = row[defCourseDEPartner] ? row[defCourseDEPartner].toLowerCase().includes(partnerFilter.toLowerCase()) : false;
    
        // Parse the dates
        const startDate = new Date(row[defCourseDEStartDate]);
        const endDate = new Date(row[defCourseDEEndDate]);
        const filterDateParsed = filterDate ? new Date(filterDate) : null;
    
        // Check if filterDate is between startDate and endDate
        const dateMatch = filterDateParsed ? (filterDateParsed >= startDate && filterDateParsed <= endDate) : false;
    
        // Apply the appropriate filter based on the presence of partnerFilter and filterDate
        if (!partnerFilter && filterDateParsed) {
             return dateMatch;
        } else if (partnerFilter && !filterDateParsed) {
             return partnerMatch;
        } else {
            return partnerMatch || dateMatch;
        }
        return false;        
    });
    

    return (
        <div>
            <table style={{ width: '100%' }}>
                <tbody>
                    <tr>
                        <td style={{ verticalAlign: 'top' }}>
                            {showTable && (
                                <div style={{ width: '100%' }}>
                                    <h3>Course Details</h3>
                                    <p>Course Name: {course.courseName}</p>
                                    <div>
                                        <label>
                                            Date:
                                            <DatePicker
                                                selected={filterDate}
                                                onChange={(date) => handleFilterCourseDate(date)}
                                                dateFormat="yyyy-MM-dd"
                                                placeholderText='YYYY-MM-DD'
                                            />
                                        </label>
                                        <br />
                                        <label>
                                            Partner:
                                            <input
                                                type="text"
                                                name="partner"
                                                value={values.partner}
                                                onChange={handleTextChange}
                                            />
                                        </label>
                                        
                                    </div>
                                    {loading && 'Loading...'}
                                    {error && error.message}
                                    {showTable && data?.events && (
                                        <Table>
                                            <TableHead>
                                                <TableRowHead>
                                                    {dProgramDE.data.programStages.programStageDataElements.map((dataElementObject, index) => {
                                                        if (dataElementObject.dataElement.displayName === 'jtrain_course_attendees') return null;
                                                        return (
                                                            <TableCellHead key={index}>
                                                                {dataElementObject.dataElement.displayName === 'jtrain_course_attendees_count' ? '# Attendees' : dataElementObject.dataElement.displayName}
                                                            </TableCellHead>
                                                        );
                                                    })}
                                                    <TableCellHead>View</TableCellHead>
                                                </TableRowHead>
                                            </TableHead>
                                            <TableBody>
                                                {filteredRows.map(({ event, eventDate, ...values }) => (
                                                    <TableRow key={event} style={event === selectedRow ? { backgroundColor: 'blue' } : {}}>
                                                        {dProgramDE.data.programStages.programStageDataElements.map(dataElementObject => {
                                                            if (dataElementObject.dataElement.displayName === 'jtrain_course_attendees') return null;
                                                            if (dataElementObject.dataElement.displayName === 'Location')
                                                                return (
                                                                    <TableCell key={dataElementObject.dataElement.id}>
                                                                        {orgUnitsData?.orgUnits?.organisationUnits?.find(ou => ou.id === values[dataElementObject.dataElement.id].split('/').pop())?.displayName || ''}
                                                                    </TableCell>
                                                                );

                                                            return (
                                                                <TableCell key={dataElementObject.dataElement.id}>
                                                                    {values[dataElementObject.dataElement.id]}
                                                                </TableCell>
                                                            );
                                                        })}
                                                        <TableCell rowSpan={1}>
                                                            <button onClick={() => {
                                                                const selectedCourseData = {
                                                                    event: event,
                                                                    ...values
                                                                };

                                                                const variablesToPassBack = dProgramDE.data.programStages.programStageDataElements.reduce((acc, dataElementObject) => {
                                                                    if (!dataElementObject.dataElement.displayName.startsWith('jtrain')) {
                                                                        if(dataElementObject.dataElement.displayName.toLowerCase().startsWith('course')){
                                                                            acc[dataElementObject.dataElement.displayName] = values[dataElementObject.dataElement.id].replace('course', '');    
                                                                            acc[dataElementObject.dataElement.displayName] = acc[dataElementObject.dataElement.displayName].replace('Course', '');
                                                                        }
                                                                        if(dataElementObject.dataElement.displayName.toLowerCase().startsWith('location')){
                                                                            acc[dataElementObject.dataElement.displayName] = orgUnitsData?.orgUnits?.organisationUnits?.find(ou => ou.id === values[dataElementObject.dataElement.id].split('/').pop())?.displayName || '';
                                                                        }
                                                                        else{
                                                                            acc[dataElementObject.dataElement.displayName] = values[dataElementObject.dataElement.id];
                                                                        }
                                                                    }
                                                                    return acc;
                                                                }, {});

                                                                setSelectedCourseDate(selectedCourseData);
                                                                setSelectedRow(event);
                                                                setShowCourseDetails(true);
                                                                setRefreshKey(prevKey => prevKey + 1);
                                                                setShowTable(false);
                                                                onButtonClick(variablesToPassBack);
                                                            }}><IconView24 /></button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </div>
                            )}
                        </td>
                        <td rowSpan={1}>
                            <div>
                                {selectedCourseDate.event && <CourseDateAttendees key={refreshKey} eventID={selectedCourseDate.event} dElements={dataElements} />}
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};