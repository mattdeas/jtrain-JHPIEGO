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
import { useDataEngine } from '@dhis2/app-runtime';

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


export const CourseAdd = (props) => {
    const { id } = useParams();
    const [message, setMessage] = useState('');
    const dSysConstants = useDataQuery(qryConstants)
    const [trackedEntityInstance, setTrackedEntityInstance] = useState(null);
    const engine = useDataEngine();

    
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

    const handleInputChangeSelect = (event) => {
        const { name, value } = event.target;
        //console.log(`Option ID/Code: ${name}, Option Name: ${value}`);
        setFormFields(prevValues => ({ ...prevValues, [name]: value }));
    };

    // //const handleAdd = () => {
    const handleFormSubmit = async (event) => {
        event.preventDefault();
    // Get the form field values
    const newEntity = {
        attributes: data.program.programTrackedEntityAttributes.map(attr => ({
            attribute: attr.trackedEntityAttribute.id,
            value: formFields[attr.trackedEntityAttribute.id],
        })),
        orgUnit: "VgrqnQEtyOP", // Add the organizational unit ID here
        trackedEntityType: "JzSfYcJ08Ek", // Add the tracked entity type ID here
    };

    // Create the new tracked entity instance
    const createResponse = await engine.mutate({
        resource: 'trackedEntityInstances',
        type: 'create',
        data: newEntity,
    });

    // Get the ID of the newly created tracked entity instance
    const teiId = createResponse.response.importSummaries[0].reference;

    // Enroll the tracked entity instance in the program
    const enrollmentData = {
        trackedEntityInstance: teiId,
        program: "P59PhQsB6tb", // Add the program ID here
        orgUnit: "VgrqnQEtyOP", // Add the organizational unit ID here
        enrollmentDate: new Date().toISOString().split('T')[0], // Use the current date as the enrollment date
        incidentDate: new Date().toISOString().split('T')[0], // Use the current date as the incident date
    };

    await engine.mutate({
        resource: 'enrollments',
        type: 'create',
        data: enrollmentData,
    });

    setMessage('Saved successfully');
        props.onSaved();
    };
    


    console.log({ dSysConstants })
    // Check if dSysConstants and constants exist
    if (dSysConstants && dSysConstants.data && dSysConstants.data.attributes && dSysConstants.data.attributes.constants) {
        // Find the jtrain-TEI-Type-Staff and jtrain-DefaultStaffOrgUnit objects
    }

    const { loading: loading1, error1, data } = useDataQuery(qryProgramFields, {
        variables: {
          id:  "P59PhQsB6tb", // Use the ID of the program you want to fetch
        },
    });

    const [formFields, setFormFields] = useState({});

    
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
    <h1>New Course Details</h1>

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
                        {/* <th>ID</th>
                        <th>Name</th>
                        <th>Value</th> */}
                    </tr>
                </thead>
                <tbody>
                    {data.program.programTrackedEntityAttributes.map(({ trackedEntityAttribute }) => (
                        <tr key={trackedEntityAttribute.id}>
                            {/* <td style={{width: '0px'}}>{trackedEntityAttribute.id}</td> */}
                            <td>
                                <label>{trackedEntityAttribute.name}</label>
                            </td>
                            <td>
                                {trackedEntityAttribute.valueType === 'TEXT' ? (
                                    trackedEntityAttribute.optionSet && trackedEntityAttribute.optionSet.options ? (
                                        <select name={trackedEntityAttribute.id} onChange={handleInputChangeSelect}>
                                            <option value="">Select...</option>
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
            <button type="submit">Save</button>
            <button type="button" onClick={props.onCancel}>Cancel</button>
            {message && <p>{message}</p>}
        </form>
    )
}
  </div>
)
}
