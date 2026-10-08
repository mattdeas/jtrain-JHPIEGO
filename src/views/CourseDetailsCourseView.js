import { useDataQuery } from '@dhis2/app-runtime';
import {
    Table,
    TableBody,
  CircularLoader,
    TableCell,
    TableCellHead,
    TableHead,
    TableRow,
    TableRowHead,
} from '@dhis2/ui';
import React, { useState } from 'react';
import { utilConfigConstantValueByName } from '../utils/utils';  


/**
 * CourseDetailsCourseView
 * Read-only one-row summary of a single course date (event): one column per course
 * program stage data element, with internal jtrain_* fields hidden and # Attendees last.
 * Props: id - the course event ID.
 */

// Single course event with its data values
const eventQuery = {
    events: {
      resource: 'events',
      id: ({ id }) => id,
      params: {
        fields: 'event,eventDate,dataValues[dataElement,value]',
      },
    },
  };
  
  // All org units - used to turn the Location value (an org unit path) into a name
  const ORG_UNITS_QUERY = {
    orgUnits: {
        resource: 'organisationUnits',
        params: {
            paging: false,
        },
    },
};


export const CourseDetailsCourseView = ({ id }) => {

  const defCourseProgStageId = utilConfigConstantValueByName('CourseProgramStageId')
  const defStaffOrgUnitId  = utilConfigConstantValueByName('CourseProgramStageId') // unused (and reads the wrong key)
    // Column definitions: the course stage's data elements
    const { loading, error, data } = useDataQuery({
        programStages: {
          resource: `programStages/${defCourseProgStageId}`,
          params: {
            fields: 'programStageDataElements[sortOrder,dataElement[id,displayName]]',
          },
        },
      });
    const [selectedCourseDate, setSelectedCourseDate] = useState(''); 

    const { loading: orgUnitsLoading, error: orgUnitsError, data: orgUnitsData } = useDataQuery(ORG_UNITS_QUERY);    

    const { loading: eventLoading, error: eventError, data: eventData } = useDataQuery(eventQuery, {
        variables: { id: id },
      });
      if (eventLoading) return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <CircularLoader small />
          <span>Loading event data...</span>
        </div>
      );
        if (eventError) return `Error: ${eventError.message}`;

    // Grid columns: hide internal jtrain fields (except the count), and put # Attendees last
    const sortedDEs = [...(data?.programStages?.programStageDataElements || [])]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .filter(({ dataElement }) => !dataElement.displayName.startsWith('jtrain') || dataElement.displayName === 'jtrain_course_attendees_count');
    const gridDataElements = [
        ...sortedDEs.filter(({ dataElement }) => dataElement.displayName !== 'jtrain_course_attendees_count'),
        ...sortedDEs.filter(({ dataElement }) => dataElement.displayName === 'jtrain_course_attendees_count'),
    ];

    return (
        <div>
          <table style={{ width: '100%' }}>
            <tr>
              <td>
                <div style={{ width: '100%' }}>
                  {loading && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <CircularLoader small />
                      <span>Loading...</span>
                    </div>
                  )}
                  {error && error.message}
                  {data?.programStages && (
              <Table>
                <TableHead>
                  <TableRow>
                  {gridDataElements.map(({ dataElement }) => {
              // Change displayName if it's 'jtrain_course_attendees_count'
              const displayName = dataElement.displayName === 'jtrain_course_attendees_count'
                ? '# Attendees'
                : dataElement.displayName;

    return <TableCell key={dataElement.id}>{displayName}</TableCell>;
  })}
  
                  </TableRow>
                  
                </TableHead>
                
                <TableBody>
  {eventData?.events && (
    <TableRow>
    {gridDataElements.map(({ dataElement }) => {
    // Create a mapping of dataElement to value
    const dataElementToValue = eventData.events.dataValues.reduce((map, { dataElement, value }) => {
      map[dataElement] = value;
      return map;
    }, {});

    if (dataElement.displayName === 'Location') {
      return <TableCell key={dataElement.id}>
      {orgUnitsData?.orgUnits?.organisationUnits?.find(orgUnit => orgUnit.id === dataElementToValue[dataElement.id].split('/').pop())?.displayName || ''}
      </TableCell>;
    }
    else
      return <TableCell key={dataElement.id}>{dataElementToValue[dataElement.id]}</TableCell>;
  })}
    </TableRow>
  )}
</TableBody>
              </Table>
            )}
                </div>
              </td>
            </tr>
          </table>
        </div>
      );
};