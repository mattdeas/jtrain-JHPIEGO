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
import { utilConfigConstantValueByName } from '../utils/utils';  


const eventQuery = {
    events: {
      resource: 'events',
      id: ({ id }) => id,
      params: {
        fields: 'event,eventDate,dataValues[dataElement,value]',
      },
    },
  };
  
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
  const defStaffOrgUnitId  = utilConfigConstantValueByName('CourseProgramStageId')
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
      if (eventLoading) return 'Loading event data...';
        if (eventError) return `Error: ${eventError.message}`;
    
    return (
        <div>
          <table style={{ width: '100%' }}>
            <tr>
              <td>
                <div style={{ width: '100%' }}>
                  {loading && 'Loading...'}
                  {error && error.message}
                  {data?.programStages && (
              <Table>
                <TableHead>
                  <TableRow>
                  {data.programStages.programStageDataElements
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map(({ dataElement }) => {
                      // Skip rendering if displayName is 'jtrain_course_attendees'
                      if (dataElement.displayName === 'jtrain_course_attendees') {
                        return null;
                  }

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
    {data.programStages.programStageDataElements
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map(({ dataElement }) => {
    // Skip rendering if displayName starts with 'jtrain' but is not 'jtrain_course_attendees_count'
    if (dataElement.displayName.startsWith('jtrain') && dataElement.displayName !== 'jtrain_course_attendees_count') {
      return null;
    }

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