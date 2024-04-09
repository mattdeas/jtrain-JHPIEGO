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
import { utilGetConstantValueByName } from '../utils/utils';



const eventQuery = {
    events: {
      resource: 'events',
      id: ({ id }) => id,
      params: {
        fields: 'event,eventDate,dataValues[dataElement,value],trackedEntityInstance[*]',
      },
    },
  };
  
  const trackedEntityInstanceQuery = {
    trackedEntityInstance: {
        resource: 'trackedEntityInstances',
        id: ({ id }) => id,
    },
};





export const CourseDetailsStaffView = ({ course }) => {

  const defCourseProgramId = utilGetConstantValueByName('jtrain-courseprogramstage')
  const { loading, error, data } = useDataQuery({
      programStages: {
        resource: `programStages/${defCourseProgramId}`,
        params: {
          fields: 'programStageDataElements[sortOrder,dataElement[id,displayName]]',
        },
      },
    });
  
  const { loading: eventLoading, error: eventError, data: eventData } = useDataQuery(eventQuery, {
      variables: { id: course },
  });

  let teiData;
  if (eventData && eventData.events.trackedEntityInstance) {
      const { loading: teiLoading, error: teiError, data } = useDataQuery(trackedEntityInstanceQuery, {
          variables: { id: eventData.events.trackedEntityInstance },
      });
      if (teiLoading) return 'Loading TEI data...';
      if (teiError) return `Error: ${teiError.message}`;
      teiData = data;
  }

  if (eventLoading) return 'Loading event data...';
  if (eventError) return `Error: ${eventError.message}`;

  console.log('matt', teiData)

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
                  {teiData && teiData.trackedEntityInstance.attributes.map(attribute => (
                  <TableCell key={attribute.attribute}>{attribute.displayName}</TableCell>
                  ))}
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
      {teiData && teiData.trackedEntityInstance.attributes.map(attribute => (
          <TableCell key={attribute.attribute}>{attribute.value}</TableCell>
      ))}
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