import React from 'react';
import { useDataQuery } from '@dhis2/app-runtime';

const constantsQuery = {
  constants: {
    resource: 'constants',
    params: {
      fields: ['displayName', 'id', 'code', 'value'],
      paging: false,
    },
  },
};
const deQuery = {
    dataElements: {
      resource: 'dataElements',
      params: {
        fields: ['displayName', 'id', 'code', 'value'],
        filter: ['displayName:ilike:jtrain'],
        paging: false,
      },
    },
  };

  export const Settings = () => {
    const { loading: loadingConstants, error: errorConstants, data: dataConstants } = useDataQuery(constantsQuery);
    const { loading: loadingDE, error: errorDE, data: dataDE } = useDataQuery(deQuery);
  
    if (loadingConstants || loadingDE) return <span>Loading...</span>;
    if (errorConstants) return <span>Error: {errorConstants.message}</span>;
    if (errorDE) return <span>Error: {errorDE.message}</span>;
  
    const handleUpdate = (id, code, value) => {
      console.log(`Update constant with id ${id}, code ${code}, and value ${value}`);
    };

  return (
    <div>
      <h1>System Constants</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Code</th>
            <th>Value</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {dataConstants.constants.constants.map(({ displayName, id, code, value }) => (
            <tr key={id}>
              <td>{displayName}</td>
              <td><input type="text" defaultValue={code} id={`code-${id}`} /></td>
              <td><input type="text" defaultValue={value} id={`value-${id}`} /></td>
              <td>
                <button onClick={() => handleUpdate(id, document.getElementById(`code-${id}`).value, document.getElementById(`value-${id}`).value)}>
                  Update
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr />
        <h1>Data Elements</h1>
        <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Code</th>
            <th>Value</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {dataDE.dataElements.dataElements.map(({ displayName, id, code, value }) => (
            <tr key={id}>
              <td>{displayName}</td>
              <td><input type="text" defaultValue={code} id={`de-code-${id}`} /></td>
              <td><input type="text" defaultValue={value} id={`de-value-${id}`} /></td>
              <td>
                {/* <button onClick={() => handleUpdate(id, document.getElementById(`de-code-${id}`).value, document.getElementById(`de-value-${id}`).value)}>
                  Update
                </button> */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};