import { useDataQuery, useDataMutation } from '@dhis2/app-runtime'
import { useParams } from 'react-router-dom';
import { Table, TableBody,    TableCell,    TableCellHead,    TableHead,    TableRow,    TableRowHead,} from '@dhis2/ui'
import React, {useState, useEffect} from 'react'
/**
 * This defined the data that we want to get
 * The `app-runtime` will be explained in a another session after this one,
 * so you don't have to worry about the specifics for now
 */

const today = new Date();
const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

const qryTrackedEntityInstance = {
    trackedEntityInstance: {
        resource: 'trackedEntityInstances',
        id: ({ id }) => id,
        params: {
            fields: ['attributes[attribute,value]'],
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

const mutation = {
    resource: 'trackedEntityInstances',
    type: 'create',
    data: ({ newEntity }) => newEntity,
};

const handleUpdate = () => {
    // Here, you can add the code to create a new tracked entity with the attributes from the inputs.
    // You can use the DHIS2 API to create the new entity.
};



const handleCancel = () => {
    // Here, you can add the code to navigate to the StaffSearch form.
    // The exact code will depend on how you've set up your routing.
};

const qryProgramFields = {
    program: {
      resource: 'programs',
      id: ({ id }) => id,
      params: {
        fields: ['id', 'name', 'programTrackedEntityAttributes[sortOrder,trackedEntityAttribute[id,name,valueType,mandatory,optionSet[id,name,options[id,code,name,displayName]]]]'],
      },
    },
};


export const StaffDetailArchive = () => {
    
    const dSysConstants = useDataQuery(qryConstants)
    const { trackedEntityId } = useParams();
    // const { loading: loading1, error: error1, data: data1 } = useDataQuery(qryTrackedEntityInstance, {
    //     variables: {
    //         id: trackedEntityId,
    //     },
    // });

    let staffMemberid, defaultStaffOrgUnit;
    const [defaultStaffProg, setDefaultStaffProg] = useState(null);
    const { loading: loadingProgramFields, error: errorProgramFields, data: dataProgramFields } = useDataQuery(qryProgramFields, {
        variables: {
            id: defaultStaffProg, // replace this with the id of the program
        },
    });

    useEffect(() => {
       /*  if (data1) {
            const attributes = data1.trackedEntityInstance.attributes.reduce((acc, attr) => {
                acc[attr.attribute] = attr.value;
                return acc;
            }, {});
            setFormFields(attributes);
        } */

        if (dSysConstants && dSysConstants.data && dSysConstants.data.attributes && dSysConstants.data.attributes.constants) {
            const defaultStaffProgObj = dSysConstants.data.attributes.constants.find(item => item.displayName === 'jtrain-StaffProgram');
            setDefaultStaffProg(defaultStaffProgObj ? defaultStaffProgObj.code : null);
        }
    }, [dSysConstants]);


    
    // Use the useDataMutation hook
    const [mutate, { loading: loading2, error }] = useDataMutation(mutation);


    
    console.log({ dSysConstants })
    // Check if dSysConstants and constants exist
    if (dSysConstants && dSysConstants.data && dSysConstants.data.attributes && dSysConstants.data.attributes.constants) {
        // Find the jtrain-TEI-Type-Staff and jtrain-DefaultStaffOrgUnit objects
        const staffMemberObj = dSysConstants.data.attributes.constants.find(item => item.displayName === 'jtrain-TEI-Type-Staff');
        const defaultStaffOrgUnitObj = dSysConstants.data.attributes.constants.find(item => item.displayName === 'jtrain-DefaultStaffOrgUnit');
        const defaultStaffProgObj = dSysConstants.data.attributes.constants.find(item => item.displayName === 'jtrain-StaffProgram');
        
        // Extract the values
        staffMemberid = staffMemberObj ? staffMemberObj.code : null;
        defaultStaffOrgUnit = defaultStaffOrgUnitObj ? defaultStaffOrgUnitObj.code : null;
        defaultStaffProg = defaultStaffProgObj ? defaultStaffProgObj.code : null;
        console.log('Constants Loaded')// Log the values to the console
        
    }
    
    // Define a state variable for the form fields
    const [formFields, setFormFields] = useState({});

    const handleInputChange = (event) => {
        // Update the state with the new value of the changed field
        // setFormFields({
        //     ...formFields,
        //     [event.target.name]: event.target.value,
        // });
    };
    return (
  <div>
    <h1>Staff Details</h1>

    {
      // display that the data is being loaded
      // when loading is true
      //loading1 && 'Loading...'
    }

    {
      // display the error message
      // is an error occurred
      error && error.message
    }

    {
      // if there is any data available
      dataProgramFields?.program?.programTrackedEntityAttributes && (
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Value Type</th>
            </tr>
        </thead>
        <tbody>
            {dataProgramFields.program.programTrackedEntityAttributes.map(({ trackedEntityAttribute }) => (
                <tr key={trackedEntityAttribute.id}>
                    <td>{trackedEntityAttribute.id}</td>
                    <td>
                        <label>{trackedEntityAttribute.name}</label>
                    </td>
                    <td>
                        {trackedEntityAttribute.valueType === 'TEXT' ? (
                            trackedEntityAttribute.optionSet && trackedEntityAttribute.optionSet.options ? (
                                <select name={trackedEntityAttribute.id} onChange={handleInputChange} value={formFields[trackedEntityAttribute.id]}>
                                    {trackedEntityAttribute.optionSet.options.map(option => (
                                        <option key={option.id} value={option.code}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input type="text" name={trackedEntityAttribute.id} onChange={handleInputChange} value={formFields[trackedEntityAttribute.id]} />
                            )
                        ) : trackedEntityAttribute.valueType === 'DATE' ? (
                            <input type="date" name={trackedEntityAttribute.id} onChange={handleInputChange} value={formFields[trackedEntityAttribute.id]} />
                        ) : trackedEntityAttribute.valueType === 'NUMBER' ? (
                            <input type="number" name={trackedEntityAttribute.id} onChange={handleInputChange} value={formFields[trackedEntityAttribute.id]} />
                        ) : (
                            trackedEntityAttribute.valueType
                        )}
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
)
    }
  </div>
)
}
