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
import { CourseDateAttendees } from './CourseDateAttendees'
import { utilGetConstantValueByName } from '../utils/utils';
import { IconView16, IconView24 } from '@dhis2/ui';


const ORG_UNITS_QUERY = {
    orgUnits: {
        resource: 'organisationUnits',
        params: {
            paging: false,
        },
    },
};

export const CourseDetails = ({ course, updateHeadings }) => {

    const defCourseProgramId = utilGetConstantValueByName('jtrain-courseprogram')
    const defCourseOrgUnitId = utilGetConstantValueByName('jtrain-defaultcourseorgunit')
    const defCourseProgramStageId = utilGetConstantValueByName('jtrain-courseprogramstage')
    const { loading: orgUnitsLoading, error: orgUnitsError, data: orgUnitsData } = useDataQuery(ORG_UNITS_QUERY);
    console.log('course:', course)
console.log('orgunitsdata',orgUnitsData)
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
                fields: 'event,eventDate,dataValues[dataElement,value]'
            })
        }
    };

    const { loading, error, data, refetch } = useDataQuery(eventQuery, {
        variables: {
            trackedEntityInstance: course.trackedEntityInstance
        }
    });
    const [selectedRow, setSelectedRow] = useState(null);
    const [showCourseDetails, setShowCourseDetails] = useState(false);
    const [selectedCourseDate, setSelectedCourseDate] = useState(''); 
    const [showTable, setShowTable] = useState(true);
    console.log('id:',course)

    
    
    const dProgramDE = useDataQuery(qryProgramDataElements);
    console.log('dataStages', dProgramDE);
    if (dProgramDE.data && dProgramDE.data.programStages) {
        console.log('dataStagesDE', dProgramDE.data.programStages.programStageDataElements);
    }

    const [refreshKey, setRefreshKey] = useState(0);

    // Check if data is loaded
    if (dProgramDE.loading) return 'Loading...';
    if (loading) return 'Loading...';
    if (error) return error.message;
    if (!data || !data.events) return 'No data';
        // Transform the data into an array of objects where each object represents a row in the table
    const rows = data.events.events.map(({ event, eventDate, dataValues }) => {
        const row = { event, eventDate };
        dataValues.forEach(({ dataElement, value }) => {
            row[dataElement] = value;
        });
        return row;
    });

    const dataElements = [...new Set(data.events.events.flatMap(({ dataValues }) => dataValues.map(({ dataElement }) => dataElement)))];

    const onButtonClick = (variablesToPassBack) => {
        
        const variablesString = Object.entries(variablesToPassBack)
        .map(([key, value]) => `${key}-${value}`)
        .join('-');
        // Use variablesToPassBack in your function

        updateHeadings(variablesString);

    };

    return (
        <div>CourseDetails.js
            <table style={{width: '100%'}}>
            
                <tr>
                    <td style={{verticalAlign: 'top'}}>
                    {showTable && (
                        <div style={{ width: '100%' }}>
                            <h3>Course Details</h3>
                            <p>Course Name: {course.courseName}</p>
    
                            {loading && 'Loading...'}
                            {error && error.message}
                            {showTable && data?.events && (
                                <Table>
                                    <TableRowHead>
                                        {dProgramDE.data.programStages.programStageDataElements.map((dataElementObject, index) => {
                                            if (dataElementObject.dataElement.displayName === 'jtrain_course_attendees') return null;
                                            return (
                                                <TableCellHead key={index}>
                                                    {dataElementObject.dataElement.displayName === 'jtrain_course_attendees_count' ? '# Attendees' : dataElementObject.dataElement.displayName}
                                                </TableCellHead>
                                            );
                                        })}
                                    </TableRowHead>
                                    <TableBody>
                                        {rows.map(({ event, eventDate, ...values }) => (
                                            <TableRow key={event} style={event === selectedRow ? {backgroundColor: 'blue'} : {}}>
                                                {dProgramDE.data.programStages.programStageDataElements.map(dataElementObject => {
                                                    if (dataElementObject.dataElement.displayName === 'jtrain_course_attendees') return null;
                                                    if (dataElementObject.dataElement.displayName === 'Location') 
                                                    return (
                                                        <TableCell key={dataElementObject.dataElement.id}>
                                                            {orgUnitsData.orgUnits.organisationUnits.find(ou => ou.id === values[dataElementObject.dataElement.id])?.displayName}
                                                        </TableCell>
                                                    
                                                    );
                                                    
                                                    return (
                                                        <TableCell key={dataElementObject.dataElement.id}>
                                                            
                                                            {values[dataElementObject.dataElement.id]}
                                                        </TableCell>
                                                    );
                                                    
                                                })}
                                                <TableCell rowSpan={2}>
                                                <button onClick={() => {
                                                    const selectedCourseData = {
                                                        event: event,
                                                        ...values
                                                    };

                                                    // Gather the variables to pass back
                                                    const variablesToPassBack = dProgramDE.data.programStages.programStageDataElements.reduce((acc, dataElementObject) => {
                                                        if (!dataElementObject.dataElement.displayName.startsWith('jtrain')) {
                                                            acc[dataElementObject.dataElement.displayName] = values[dataElementObject.dataElement.id];
                                                        }
                                                        return acc;
                                                    }, {});

                                                    setSelectedCourseDate(selectedCourseData);
                                                    setSelectedRow(event); // Set the selected row
                                                    setShowCourseDetails(true);
                                                    setRefreshKey(prevKey => prevKey + 1); // Increment the refresh key
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
                    <td style={{ rowspan: 2 }}>
                        <div>
                            {selectedCourseDate.event && <CourseDateAttendees key={refreshKey} eventID={selectedCourseDate.event} dElements={dataElements}/>}
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    );
};