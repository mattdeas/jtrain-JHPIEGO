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
import { getConstantValueByName } from '../utils';

// const eventQuery = {
//     events: {
//         resource: 'events',
//         params: ({ trackedEntityInstance }) => ({
//             program: 'P59PhQsB6tb',
//             orgUnit: 'VgrqnQEtyOP',
//             trackedEntityInstance,
//             fields: 'event,eventDate,dataValues[dataElement,value]'
//         })
//     }
// };

const eventQuery = {
    events: {
      resource: 'events',
      id: ({ id }) => id,
      params: {
        fields: 'event,eventDate,dataValues[dataElement,value]',
      },
    },
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



export const CourseDetailsStaffView = ({ course }) => {

    const defCourseProgramId = getConstantValueByName('jtrain-courseprogramstage')
    const { loading, error, data } = useDataQuery({
        programStages: {
          resource: `programStages/${defCourseProgramId}`,
          params: {
            fields: 'programStageDataElements[sortOrder,dataElement[id,displayName]]',
          },
        },
      });
    console.log('dataStages', data);
    const [selectedCourseDate, setSelectedCourseDate] = useState(''); 

    const dSysConstants = useDataQuery(qryConstants);
    console.log(dSysConstants);

    
    const { loading: eventLoading, error: eventError, data: eventData } = useDataQuery(eventQuery, {
        variables: { id: course },
      });
      if (eventLoading) return 'Loading event data...';
        if (eventError) return `Error: ${eventError.message}`;
    

      console.log(eventData)
    if (dSysConstants.loading) return 'Loading...';
    if (dSysConstants.error) return dSysConstants.error.message;
    if (!dSysConstants.data.attributes || !dSysConstants.data.attributes.constants) return 'No constants data';

    // Create a mapping of code to displayName from dSysConstants
    const codeToDisplayName = dSysConstants.data.attributes.constants.reduce((map, constant) => {
        map[constant.code] = constant.displayName;
        return map;
    }, {});
    
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
                    if (dataElement.displayName.startsWith('jtrain')) {
                      return null;
                    }
                    return <TableCell key={dataElement.id}>{dataElement.displayName}</TableCell>;
                  })}
                  </TableRow>
                  
                </TableHead>
                {/* <TableBody>
                    {eventData?.events?.dataValues.map(({ dataElement, value }) => (
                    <TableRow key={dataElement}>
                        <TableCell>{dataElement}</TableCell>
                        <TableCell>{value}</TableCell>
                    </TableRow>
                    ))}
                </TableBody> */}
                <TableBody>
                {eventData?.events && (
    <TableRow>
      {data.programStages.programStageDataElements
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(({ dataElement }) => {
          // If dataElement.displayName starts with 'jtrain', ignore it
          if (dataElement.displayName.startsWith('jtrain')) {
            return null;
          }

          // Create a mapping of dataElement to value
          const dataElementToValue = eventData.events.dataValues.reduce((map, { dataElement, value }) => {
            map[dataElement] = value;
            return map;
          }, {});

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