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

const today = new Date();
//const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

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

export const Staffadd = () => {
    const { id } = useParams();
    const dSysConstants = useDataQuery(qryConstants)
    const [trackedEntityInstance, setTrackedEntityInstance] = useState(null);
    

    const { loading: loadingEntity, error: errorEntity, data: dataEntity } = useDataQuery(qryTrackedEntityInstance, {
        variables: {
         //   id: "HuZ5Kc4GSUe", // Replace with the ID of the tracked entity instance you want to fetch
         id,
        },
    });
    // Use the useDataMutation hook
    const [mutate, { loading: loading2, error }] = useDataMutation(mutation);


    const handleInputChange = (event) => {
        console.log(event)

        const { name, value } = event.target;
        console.log('name', name)
        console.log('value', value)
        setFormFields(prevFields => ({
            ...prevFields,
            [name]: value,
        }));
    };

    // const handleFormSubmit = async (event) => {
    //     event.preventDefault();
    //     console.log('formFields', formFields);
        
    //     try {
    //         const response = await mutate({ data: formFields });
    
    //         console.log('Data uploaded successfully', response);
    //     } catch (error) {
    //         console.error('Error uploading data', error);
    //     }
    // };

    // const handleFormSubmit = async (event) => {
    //     event.preventDefault();
    
    //     // Transform formFields into the structure expected by the API
    //     const attributes = Object.entries(formFields).reduce((obj, [attribute, value]) => {
    //         obj[attribute] = value;
    //         return obj;
    //     }, {});
    
    //     // Define the mutation object
    //     const updateMutation = {
    //         type: 'update',
    //         resource: 'trackedEntityInstance',
    //         id: id, // Replace with the ID of the tracked entity instance you want to update
    //         attributes
    //     };
    
    //     console.log('updateMutation', updateMutation);
    
    //     try {
    //         const response = await mutate(updateMutation);
    
    //         console.log('Data uploaded successfully', response);
    //     } catch (error) {
    //         console.error('Error uploading data', error);
    //     }
    //};
    
    //const handleAdd = () => {
    const handleFormSubmit = async (event) => {
        event.preventDefault();
        // Get the form field values
        const newEntity = {
            attributes: data.program.programTrackedEntityAttributes.map(attr => ({
                attribute: attr.trackedEntityAttribute.id,
                value: formFields[attr.trackedEntityAttribute.id],
            })),
            program: "Ss21byybIqu", // Add the program ID here
            orgUnit: "VgrqnQEtyOP", // Add the organizational unit ID here
            trackedEntityType: "W9FNXXgGbm7", // Add the tracked entity type ID here
            id: id,
        };
        console.log('newEntity', newEntity);
        // Call the mutate function
        mutate({ newEntity })
    .then((result) => {
       console.log('Mutation result:', result);
    })
    .catch((error) => {
        console.log('Mutation error:', error);
    });
    };


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
    }

    const { loading: loading1, error1, data } = useDataQuery(qryProgramFields, {
        variables: {
          id:  "Ss21byybIqu", // Use the ID of the program you want to fetch
        },
    });

    const [formFields, setFormFields] = useState({});

    useEffect(() => {
        if (!loadingEntity && !errorEntity && dataEntity?.trackedEntityInstance?.attributes) {
            setTrackedEntityInstance(dataEntity.trackedEntityInstance.attributes);
        }
    }, [dataEntity, loadingEntity, errorEntity]);
    
    // useEffect(() => {
    //     const initialFormFields = trackedEntityInstance.reduce((fields, attr) => ({
    //         ...fields,
    //         [attr.attribute]: attr.value,
    //     }), {});
    
    //     setFormFields(initialFormFields);
    // }, [trackedEntityInstance]);

    useEffect(() => {
        if (trackedEntityInstance) {
            const initialFormFields = trackedEntityInstance.reduce((fields, attr) => ({
                ...fields,
                [attr.attribute]: attr.value,
            }), {});
        
            setFormFields(initialFormFields);
        }
    }, [trackedEntityInstance]);

    const findAttributeValue = (attributeId) => {
        // If the attribute value exists in formFields, return it
        if (formFields[attributeId]) {
            return formFields[attributeId];
        }
    
        // Otherwise, find the attribute value in trackedEntityInstance
        if (trackedEntityInstance) {
            const attribute = trackedEntityInstance.find(attr => attr.attribute === attributeId);
            return attribute ? attribute.value : '';
        }
    
        return '';
    };
    
    return (
  <div>
    <h1>Staff Details</h1>

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
        <form onSubmit={handleFormSubmit}>
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
                            <td style={{width: '0px'}}>{trackedEntityAttribute.id}</td>
                            <td>
                                <label>{trackedEntityAttribute.name}</label>
                            </td>
                            <td>
                                {trackedEntityAttribute.valueType === 'TEXT' ? (
                                    trackedEntityAttribute.optionSet && trackedEntityAttribute.optionSet.options ? (
                                        <select name={trackedEntityAttribute.id} onChange={handleInputChange}>
                                            {trackedEntityAttribute.optionSet.options.map(option => (
                                                <option key={option.id} value={option.code}>
                                                    {option.name}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input type="text" name={trackedEntityAttribute.id} value={findAttributeValue(trackedEntityAttribute.id)} onChange={handleInputChange}  />
                                    )
                                ) : trackedEntityAttribute.valueType === 'DATE' ? (
                                    <input type="text" name={trackedEntityAttribute.id} value={findAttributeValue(trackedEntityAttribute.id)}  onChange={handleInputChange}/>
                                ) : trackedEntityAttribute.valueType === 'NUMBER' ? (
                                    <input type="text" name={trackedEntityAttribute.id} value={findAttributeValue(trackedEntityAttribute.id)} onChange={handleInputChange}/>
                                ) : (
                                    trackedEntityAttribute.valueType
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button type="submit">Submit</button>
        </form>
    )
}
  </div>
)
}
