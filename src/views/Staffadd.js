import { useDataQuery, useDataMutation , useDataEngine} from '@dhis2/app-runtime'
import { CustomDataProvider } from '@dhis2/ui'
import {
    Table,
    TableBody,
    TableCell,
    TableCellHead,
    TableHead,
    TableRow,
    TableRowHead,
} from '@dhis2/ui'
import { BrowserRouter as Router, Route, Link, Routes, useLocation , useParams, useNavigate} from 'react-router-dom';
import React, {useState, useEffect} from 'react'
import { utilGetConstantValueByName,  utilConfigConstantValueByName } from '../utils/utils';
import { OrganisationUnitTree } from '@dhis2/ui';
import { CircularLoader } from '@dhis2/ui';

const today = new Date();
//const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;


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
    const [message, setMessage] = useState('');
    const engine = useDataEngine();

    const defStaffOrgUnitId = utilConfigConstantValueByName('DefaultStaffOrgUnit')
    const defStaffProgId = utilConfigConstantValueByName('StaffProgram')
    const defStaffEntityType = utilConfigConstantValueByName('TEITypeStaff')
    const defLocationTEA = utilConfigConstantValueByName('LocationTEA')

    const { loading: loadingEntity, error: errorEntity, data: dataEntity } = useDataQuery(qryTrackedEntityInstance, {
        variables: {
         //   id: "1", // Replace with the ID of the tracked entity instance you want to fetch
         id,
        },
    });
    // Use the useDataMutation hook
    const [mutate, { loading: loading2, error }] = useDataMutation(mutation);

    const navigate = useNavigate();
    const handleInputChange = (event) => {
        console.log(event)

        const { name, value } = event.target;
        setFormFields(prevFields => ({
            ...prevFields,
            [name]: value,
        }));
    };

    //const handleAdd = () => {
    const handleFormSubmit = async (event) => {
        event.preventDefault();
        // Get the form field values
        const newEntity = {
            attributes: data.program.programTrackedEntityAttributes.map(attr => ({
                attribute: attr.trackedEntityAttribute.id,
                value: formFields[attr.trackedEntityAttribute.id],
            })),
            program: defStaffProgId, // Add the program ID here
            orgUnit: defStaffOrgUnitId, // Add the organizational unit ID here
            trackedEntityType: defStaffEntityType, // Add the tracked entity type ID here
            id: id,
        };
        console.log('newEntity', newEntity);
        // Call the mutate function
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

        program: defStaffProgId, // Add the program ID here
        orgUnit: defStaffOrgUnitId, // Add the organizational unit ID here
        enrollmentDate: new Date().toISOString().split('T')[0], // Use the current date as the enrollment date
        incidentDate: new Date().toISOString().split('T')[0], // Use the current date as the incident date
    };

    await engine.mutate({
        resource: 'enrollments',
        type: 'create',
        data: enrollmentData,
    });

    setMessage('Saved successfully');
    //props.onSaved();
        //redirct to the staffview page with the id 
        setTimeout(() => {
            //setLoading(false); // Hide loading spinner
            navigate('/staffsearch');
        }, 3000);
    };


    
    const handleInputChangeSelect = (event) => {
      const { name, value } = event.target;
      //console.log(`Option ID/Code: ${name}, Option Name: ${value}`);
      setFormFields(prevFields => ({ ...prevFields, [name]: value }));
  };
    
    let staffMemberid, defaultStaffOrgUnit, defaultStaffProg;
    // console.log({ dSysConstants })
    // // Check if dSysConstants and constants exist
    // if (dSysConstants && dSysConstants.data && dSysConstants.data.attributes && dSysConstants.data.attributes.constants) {
    //     // Find the jtrain-TEI-Type-Staff and jtrain-DefaultStaffOrgUnit objects
    //     const staffMemberObj = dSysConstants.data.attributes.constants.find(item => item.displayName === 'jtrain-TEI-Type-Staff');
    //     const defaultStaffOrgUnitObj = dSysConstants.data.attributes.constants.find(item => item.displayName === 'jtrain-DefaultStaffOrgUnit');
    //     const defaultStaffProgObj = dSysConstants.data.attributes.constants.find(item => item.displayName === 'jtrain-StaffProgram');
        
    //     // Extract the values
    //     staffMemberid = staffMemberObj ? staffMemberObj.code : null;
    //     defaultStaffOrgUnit = defaultStaffOrgUnitObj ? defaultStaffOrgUnitObj.code : null;
    //     defaultStaffProg = defaultStaffProgObj ? defaultStaffProgObj.code : null;
    // }

    const { loading: loading1, error1, data } = useDataQuery(qryProgramFields, {
        variables: {
          id:  defStaffProgId, // Use the ID of the program you want to fetch
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

    const [selected, setSelected] = useState([]);
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

    const onTreeChange = ({ selected }) => {
      setSelected(selected);
      console.log('selected:' , selected)

      setFormFields(prevFields => ({
          ...prevFields,
          [defLocationTEA]: selected[0], // assuming selected is an array and you want to store the first value
      }));
  }
    
    return (
  <div>
    <h1>Staff Details</h1>

    

   

    {
    // if there is any data available
    data?.program?.programTrackedEntityAttributes && (
        <form onSubmit={handleFormSubmit}>
            <table>
                <thead>
                    
                </thead>
                <tbody>
                {data.program.programTrackedEntityAttributes.map(({ trackedEntityAttribute }) => {
    // If the name starts with 'jtrain', return null to skip this row
    if (trackedEntityAttribute.name.startsWith('jtrain')) {
      return null;
    }

    return (
      <tr key={trackedEntityAttribute.id}>
        <td style={{ verticalAlign: 'top' }}>
          <label>{trackedEntityAttribute.name}</label>
        </td>
        <td>
          
          {trackedEntityAttribute.valueType === 'TEXT' ? (
  trackedEntityAttribute.id === defLocationTEA ? (
      <div>
          <OrganisationUnitTree
              initiallyExpanded={[defStaffOrgUnitId]}
              roots={defStaffOrgUnitId} // replace with your root organisation unit ID
              selected={selected}
              onChange={onTreeChange}
              singleSelection
          />
      </div>
  ) : trackedEntityAttribute.optionSet && trackedEntityAttribute.optionSet.options ? (
      <select name={trackedEntityAttribute.id} onChange={handleInputChangeSelect} value={findAttributeValue(trackedEntityAttribute.id)}>
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
) : trackedEntityAttribute.valueType === 'ORGANISATION_UNIT' ? (
  'Data Type Not supported.'
  
) : (
  'Data Type Not supported.'
)}
        </td>
        {/* <td>{trackedEntityAttribute.valueType}</td> */}
      </tr>
    );
  })}
                </tbody>
            </table>
            <button type="submit">Submit</button>
        </form>
    )
}
    {message && <p>{message}</p>}
    {/* {loading && (
                <div className="loader">
                    <CircularLoader type="ThreeDots" color="#00BFFF" height={80} width={80} />
                </div>
            )} */}
  </div>
)
}


