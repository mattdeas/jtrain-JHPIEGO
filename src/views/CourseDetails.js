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
import { getConstantValueByName } from '../utils';

const defCourseProgramId = getConstantValueByName('jtrain-courseprogram')
const defCourseOrgUnitId = getConstantValueByName('jtrain-defaultcourseorgunit')
const defCourseProgramStageId = getConstantValueByName('jtrain-courseprogramstage')

jtrain-courseprogramstage

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

const qryConstants = {
    // One query object in the whole query
    attributes: {
        // The `attributes` endpoint should be used
        resource: 'constants',
        params: {
            // Paging is disabled
            paging: false,
            // Only the attribute properties that are required should be loaded
            fields: 'id, displayName, code, value',
        },
    },
}
const qryProgramDataElements = {
        programStages: {
          resource: `programStages/${defCourseProgramStageId}`,
          params: {
            fields: 'programStageDataElements[sortOrder,dataElement[id,displayName]]',
          },
        },
      };

export const CourseDetails = ({ course, updateHeadings }) => {
    const { loading, error, data } = useDataQuery(eventQuery, {
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

    const dSysConstants = useDataQuery(qryConstants);

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


    // Check if dSysConstants data is loaded
    if (dSysConstants.loading) return 'Loading...';
    if (dSysConstants.error) return dSysConstants.error.message;
    if (!dSysConstants.data.attributes || !dSysConstants.data.attributes.constants) return 'No constants data';

    // Create a mapping of code to displayName from dSysConstants
    const codeToDisplayName = dSysConstants.data.attributes.constants.reduce((map, constant) => {
        map[constant.code] = constant.displayName;
        return map;
    }, {});

    
    console.log('dataElements', dataElements)
    console.log(dProgramDE.data.programStages.programStageDataElements)
    // Check if dProgramDE is still loading
    
    // const onButtonClick = () => {
    //     // Define the variables you want to pass back
    //     const newLabel = 'Your new label text';
    //     const newIsSearchTableExpanded = false;
    
    //     // Call updateHeadings with the variables as arguments
    //     
    // };

    const onButtonClick = (variablesToPassBack) => {
        
        const variablesString = Object.entries(variablesToPassBack)
        .map(([key, value]) => `${key}-${value}`)
        .join('-');
        // Use variablesToPassBack in your function

        updateHeadings(variablesString);

    };

    return (
        <div>
            <table style={{width: '100%'}}>
            
                <tr>
                    <td style={{verticalAlign: 'top'}}>
                    {showTable && (
                        <div style={{ width: '100%' }}>
                            <h3>Course Details</h3>
                            <p>Thematic Area: {course.thematicArea}</p>
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
                                                    return (
                                                        <TableCell key={dataElementObject.dataElement.id}>
                                                            {values[dataElementObject.dataElement.id]}
                                                        </TableCell>
                                                    );
                                                })}
                                                <TableCell>
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
                                                }}>Select</button>
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