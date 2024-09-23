import { useDataQuery, useDataEngine } from '@dhis2/app-runtime';

import {
    Table,
    TableBody,
    TableCell,
    TableCellHead,
    TableHead,
    TableRow,
    TableRowHead,
} from '@dhis2/ui';
import React, { useEffect, useState } from 'react';
import { utilConfigConstantValueByName } from '../utils/utils';



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
      params: {
        fields: ['attributes[attribute,value]'],
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

const teiQuery = {
  trackedEntityInstance: {
    resource: 'trackedEntityInstances',
    id: ({id}) => id, // This function allows us to dynamically pass the ID later
    params: {
      fields: ['attributes'],
    },
  },
};

export const CourseDetailsStaffView = ({ course }) => {
  console.log('course', course)
  // const defCourseProgramId =  utilConfigConstantValueByName('CourseProgramStageId')
  const defCourseProgramId =  "h9zPG79AmgH";
  const { loading: orgUnitsLoading, error: orgUnitsError, data: orgUnitsData } = useDataQuery(ORG_UNITS_QUERY);
  const { loading, error, data } = useDataQuery({
      programStages: {
        resource: `programStages/${defCourseProgramId}`,
        params: {
          fields: 'programStageDataElements[sortOrder,dataElement[id,displayName]]',
        },
      },
    });
    const [teiName, setTeiName] = useState('');
    const dataEngine = useDataEngine();
  const { loading: eventLoading, error: eventError, data: eventData } = useDataQuery(eventQuery, {
    variables: { id: course },
  });

  

  const trackedEntityInstanceId = eventData?.events?.trackedEntityInstance;
 console.log('trackedEntityInstanceId', trackedEntityInstanceId)
  const trackedEntityInstanceQuery = {
    trackedEntityInstance: {
      resource: `trackedEntityInstances/${trackedEntityInstanceId}`,
      params: {
        fields: 'attributes[attribute,value]',
      },
    },
  };

  useEffect(() => {
    const fetchTEIName = async () => {
      if (eventData?.events.trackedEntityInstance) {
        try {
          const result = await dataEngine.query(teiQuery, {
            variables: { id: eventData.events.trackedEntityInstance },
          });
          const nameAttribute = result.trackedEntityInstance.attributes[0]?.value;
          setTeiName(nameAttribute);
        } catch (error) {
          console.error('Error fetching tracked entity instance:', error);
        }
      }
    };

    fetchTEIName();
  }, [eventData, dataEngine]);

  console.log('eventdata', eventData)
  // console.log('teiData', teiData)
  console.log('trackedentityinstanceid ', trackedEntityInstanceId)

 
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
                  <TableCell style={{ fontWeight: 'bold' }} colSpan={1}>Course Details</TableCell>
                  
                  
                  {data.programStages.programStageDataElements
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map(({ dataElement }) => {
                    if (dataElement.displayName.startsWith('jtrain')) {
                      return null;
                    }
                    return <TableCell style={{ fontWeight: 'bold' }} key={dataElement.id}>{dataElement.displayName}</TableCell>;
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
      {/* {teiData && teiData.trackedEntityInstance.attributes.map(attribute => (
          <TableCell key={attribute.attribute}>{attribute.value}</TableCell>
      ))} */}
      <TableCell>
      {teiName}
      </TableCell>
      {data.programStages.programStageDataElements
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(({ dataElement }) => {
          // If dataElement.displayName starts with 'jtrain', ignore it
          if (dataElement.displayName.startsWith('jtrain')) {
            return null;
          }

          // Create a mapping of dataElement to value
          let dataElementToValue = {};

          if (eventData.events && eventData.events.dataValues) {
              dataElementToValue = eventData.events.dataValues.reduce((map, { dataElement, value }) => {
                  map[dataElement] = value;
                  return map;
              }, {});
          }

          if(dataElement.displayName === 'Location') {
            // Extract the orgUnitId after the last "/"
            const fullOrgUnitId = dataElementToValue[dataElement.id];
            const orgUnitId = fullOrgUnitId.split('/').pop();
    
            // Find the orgUnit by the extracted orgUnitId
            const orgUnit = orgUnitsData.orgUnits.organisationUnits.find(orgUnit => orgUnit.id === orgUnitId);

            return (
                <TableCell key={dataElement.id}>
                    {orgUnit ? orgUnit.displayName : orgUnitId}
                </TableCell>
            );

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