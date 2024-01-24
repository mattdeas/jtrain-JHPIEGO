import { useDataQuery, useDataMutation } from '@dhis2/app-runtime'
import {
    Table,
    TableBody,
    TableCell,
    TableCellHead,
    TableHead,
    TableRow,
    TableRowHead,
} from '@dhis2/ui'
import { BrowserRouter as Router, Route, Link, Routes, useLocation , useParams} from 'react-router-dom';
import React, {useState, useEffect} from 'react'

/**
 * This defined the data that we want to get
 * The `app-runtime` will be explained in a another session after this one,
 * so you don't have to worry about the specifics for now
 */

const today = new Date();
const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

const qryTrackedEntityTypes = {
    // One query object in the whole query
    attributes: {
        // The `attributes` endpoint should be used
        resource: 'trackedEntityTypes',
        params: {
            // Paging is disabled
            paging: false,
            // Only the attribute properties that are required should be loaded
            fields: 'id, displayName',
        },
    },
}

const qryPrograms = {
    // One query object in the whole query
    attributes: {
        // The `attributes` endpoint should be used
        resource: 'programs',
        params: {
            // Paging is disabled
            paging: false,
            // Only the attribute properties that are required should be loaded
            fields: 'id, displayName',
        },
    },
}

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

const query4 = {
    programs: {
        resource: 'programs',
        params: ({ pageSize }) => ({
            order: 'displayName:asc',
            pageSize,
            page: 1
        }),
    },


}


const query = {
    // "page" variable below can be dinamically passed via refetch (see "handlePageChange" below)
    instances: {
        resource: 'trackedEntityInstances',
        params: ({ ou ,trackedEntityType }) => ({
            ou : ou,
            trackedEntityType : trackedEntityType,
        }),
    },
}


  const qryProgramFields = {
    program: {
      resource: 'programs',
      id: ({ id }) => id,
      params: {
        fields: ['id', 'name', 'programTrackedEntityAttributes[sortOrder,trackedEntityAttribute[id,name,valueType,mandatory,optionSet[id,name,options[id,code,name,displayName]]]]'],
      },
    },
};



//https://dhis2.af.jhpiego.org/api/trackedEntityInstances?ou=x0Zl6eKgC7B&trackedEntityType=W9FNXXgGbm7

const mutation = {
    resource: 'trackedEntityInstances',
    type: 'create',
    data: ({ newEntity }) => newEntity,
};

const handleUpdate = () => {
   
};

const handleCancel = () => {
  
};

const qryTrackedEntityInstance = {
    trackedEntityInstance: {
        resource: 'trackedEntityInstances',
        id: ({ id }) => id,
        params: {
            fields: ['attributes[attribute,value]'],
        },
    },
};

export const Courseview = () => {
    // This is yet another functionality provided by the `@dhis2/app-runtime`
    // For the time being it does not matter what this does exactly
    // * loading will be true while the data is being loaded
    // * error will be an instance of `Error` if something fails
    // * data will be null while the data is being loaded or if something fails
    // * data will be an object once loading is done with the following path
    //   data.attributes.attributes <- That's an array of objects
    const { id } = useParams();
    const dSysConstants = useDataQuery(qryConstants)
    const [trackedEntityInstance, setTrackedEntityInstance] = useState(null);
    const handleAdd = () => {
        // Get the form field values
        const newEntity = {
            attributes: data.program.programTrackedEntityAttributes.map(attr => ({
                attribute: attr.trackedEntityAttribute.id,
                value: formFields[attr.trackedEntityAttribute.id],
            })),
            program: "Ss21byybIqu", // Add the program ID here
            orgUnit: "VgrqnQEtyOP", // Add the organizational unit ID here
            trackedEntityType: "W9FNXXgGbm7", // Add the tracked entity type ID here
            // ... other necessary fields for a tracked entity instance
        };
    
        // Call the mutate function
        mutate({ newEntity })
    .then((result) => {
       console.log('Mutation result:', result);
       console.log('Tracked entity instance created successfully!')
    })
    .catch((error) => {
        console.log('Mutation error:', error);
        console.log('Tracked entity instance failed!')
    });
    };

    const { loading: loadingEntity, error: errorEntity, data: dataEntity } = useDataQuery(qryTrackedEntityInstance, {
        variables: {
         //   id: "HuZ5Kc4GSUe", // Replace with the ID of the tracked entity instance you want to fetch
         id,
        },
    });
    // Use the useDataMutation hook
    const [mutate, { loading: loading2, error }] = useDataMutation(mutation);


    let staffMemberid, defaultStaffOrgUnit, defaultStaffProg;
    console.log({ dSysConstants })
    // Check if dSysConstants and constants exist
    if (dSysConstants && dSysConstants.data && dSysConstants.data.attributes && dSysConstants.data.attributes.constants) {
        // Find the jtrain-StaffMember and jtrain-DefaultStaffOrgUnit objects
        const staffMemberObj = dSysConstants.data.attributes.constants.find(item => item.displayName === 'jtrain-StaffMember');
        const defaultStaffOrgUnitObj = dSysConstants.data.attributes.constants.find(item => item.displayName === 'jtrain-DefaultStaffOrgUnit');
        const defaultStaffProgObj = dSysConstants.data.attributes.constants.find(item => item.displayName === 'jtrain-StaffProgram');
        
        // Extract the values
        staffMemberid = staffMemberObj ? staffMemberObj.code : null;
        defaultStaffOrgUnit = defaultStaffOrgUnitObj ? defaultStaffOrgUnitObj.code : null;
        defaultStaffProg = defaultStaffProgObj ? defaultStaffProgObj.code : null;
        console.log('Constants Loaded')// Log the values to the console
        
    }

    


    console.log({ staffMemberid, defaultStaffOrgUnit });
    const { loading: loading1, error1, data } = useDataQuery(qryProgramFields, {
        variables: {
          id:  "Ss21byybIqu", // Use the ID of the program you want to fetch
        },
    });

    // Define a state variable for the form fields
    const [formFields, setFormFields] = useState({});

    useEffect(() => {
        if (data && !loading1 && !error1 && dataEntity && dataEntity.trackedEntityInstance) {
            setTrackedEntityInstance(dataEntity.trackedEntityInstance.attributes);
        }
    }, [data, loading1, error1, dataEntity]);
    
    console.log("trackedEntityInstance", trackedEntityInstance);
    const handleInputChange = (event) => {
        // Update the state with the new value of the changed field
        setFormFields({
            ...formFields,
            [event.target.name]: event.target.value,
        });
    };

    const findAttributeValue = (attributeId) => {
        if (trackedEntityInstance) {
            const attribute = trackedEntityInstance.find(attr => attr.attribute === attributeId);
            return attribute ? attribute.value : '';
        } else {
            return '';
        }
    };
    
    return (
  <div>
    <h1>Course Details</h1>

    {
      // display that the data is being loaded
      // when loading is true
      loading1 && 'Loading...'
    }

    {
      // display the error message
      // is an error occurred
      error && error.message
    }

    {
      // if there is any data available
      data?.program?.programTrackedEntityAttributes && (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Value Type</th>
            </tr>
        </thead>
        <tbody>
    {data.program.programTrackedEntityAttributes.map(({ trackedEntityAttribute }) => (
        <tr key={trackedEntityAttribute.id}>
            <td style="width:0px">{trackedEntityAttribute.id}</td>
            <td>
                <label>{trackedEntityAttribute.name}</label>
            </td>
            <td>
                {trackedEntityAttribute.valueType === 'TEXT' ? (
                    trackedEntityAttribute.optionSet && trackedEntityAttribute.optionSet.options ? (
                        <select name={trackedEntityAttribute.id}  onChange={handleInputChange}>
                            {trackedEntityAttribute.optionSet.options.map(option => (
                                <option key={option.id} value={option.code}>
                                    {option.name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input type="text" name={trackedEntityAttribute.id} value={findAttributeValue(trackedEntityAttribute.id)} onChange={handleInputChange} />
                    )
                ) : trackedEntityAttribute.valueType === 'DATE' ? (
                    <input type="text" name={trackedEntityAttribute.id} value={findAttributeValue(trackedEntityAttribute.id)} onChange={handleInputChange} />
                ) : trackedEntityAttribute.valueType === 'NUMBER' ? (
                    <input type="text" name={trackedEntityAttribute.id} value={findAttributeValue(trackedEntityAttribute.id)} onChange={handleInputChange} />
                ) : (
                    trackedEntityAttribute.valueType
                )}
            </td>
        </tr>
    ))}
</tbody>
        <tr>
        <td >
            
            <button >Update</button>
            <button >Cancel</button>
        </td>
        </tr>
        <tr>
            <td><hr /></td>
        </tr>
        </table>

      )
    }
  </div>
)
}
