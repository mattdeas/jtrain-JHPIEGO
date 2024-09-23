import { useDataQuery, useDataMutation, useDataEngine } from '@dhis2/app-runtime'
import { CourseDetailsStaffView } from './CourseDetailsStaffView';
import { BrowserRouter as Router, Route, Link, Routes, useLocation , useParams} from 'react-router-dom';
import React, {useState, useEffect} from 'react'
import { OrganisationUnitTree } from '@dhis2/ui';
import { CourseDateAttendeesStaffCustomFields } from './CourseDateAttendees-Staff-CustomFields';
import { IconSave16, IconCross16, IconDelete16 } from '@dhis2/ui';
import { useNavigate } from "react-router-dom";
import { utilConfigConstantValueByName } from '../utils/utils';

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const handleResize = debounce(() => {
}, 200);

window.addEventListener('resize', handleResize);

const today = new Date();
const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;


  const qryProgramFields = {
    program: {
      resource: 'programs',
      id: ({ id }) => id,
      params: {
        fields: ['id', 'name', 'programTrackedEntityAttributes[sortOrder,trackedEntityAttribute[id,name,valueType,mandatory,optionSet[id,name,options[id,code,name,displayName]]]]'],
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


const eventsQuery = (id) => ({
    events: {
        resource: 'events',
        params: {
            trackedEntityInstance: id,
            fields: ['event', 'status', 'program', 'orgUnit', 'dataValues[dataElement,value]'],
        },
    },
});



const mutation = (id) => ({
    resource: 'trackedEntityInstances',
    id: id,
    type: 'update',
    data: ({ orgUnit, attributes }) => ({
        orgUnit,
        attributes,
    }),
});



export const Staffview = () => {

    const engine = useDataEngine();
    const constantsQuery = {
        constants: {
            resource: "constants",
            params: {
                fields: ['id', 'name', 'code']
            }
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await engine.query(constantsQuery);
                if (response && response.constants && Array.isArray(response.constants.constants)) {
                    sessionStorage.setItem('constants', JSON.stringify(response.constants.constants));
                }
            } catch (error) {
                console.error('Error running query', error);
            }
        };

        fetchData();
    }, [engine]);



    const { id } = useParams();
    const [trackedEntityInstance, setTrackedEntityInstance] = useState(null);
    const [formFields, setFormFields] = useState({});
    const [mutate, { loading, error }] = useDataMutation(mutation(id))
    const [showTree, setShowTree] = useState(false);

 
    const { loading: orgUnitsLoading, error: orgUnitsError, data: orgUnitsData } = useDataQuery(ORG_UNITS_QUERY);
    const defStaffOrgUnitId = utilConfigConstantValueByName('DefaultStaffOrgUnit')
    const defStaffProgId = utilConfigConstantValueByName('StaffProgram')
    const defStaffProgCourseId = utilConfigConstantValueByName('StaffProgramCourse')
    const defLocationTEA = utilConfigConstantValueByName('LocationTEA')
    console.log('locationTEA', defLocationTEA)
    const qryTrackedEntityInstance = {
        trackedEntityInstance: {
            resource: 'trackedEntityInstances',
            id: ({ id }) => id,
            params: {
                fields: ['attributes[attribute,value]'],
                program: defStaffProgId
            },
        },
    };

    

    const { loading: loadingEntity, error: errorEntity, data: dataEntity } = useDataQuery(qryTrackedEntityInstance, {
        variables: {
         id,
        },
    });


    const deleteMutation = {
        resource: 'trackedEntityInstances',
        id: id,
        type: 'delete',
    };

    const navigate = useNavigate();

  const handleDelete = async () => {
      if (window.confirm('Are you sure you want to delete this Staff Member?')) {
          try {
              await engine.mutate(deleteMutation);
              alert('Trainee Successfully Deleted')
              navigate('/staffsearch');  // Redirect to the staffsearch page
          } catch (error) {
              alert('Failed to delete course');
          }
      }
  };


     const qryProgramDataElements = {
         "qPDE": {
             resource: 'programStages',
                "id": defStaffProgCourseId,
                "params": {
                    "fields": `programStageDataElements[program[id,${defStaffProgId}],dataElement[id,displayName],sortOrder]`,
                },

         },
    }


    const dataProgramDE  = useDataQuery(qryProgramDataElements);

    //const { loading: loadingDataElement, error: errorDataElement, data: dataElementData } = useDataQuery(dataElementQuery);
    const [responseMessage, setResponseMessage] = useState('');
    const { loading: loadingEvents, error: errorEvents, data: eventsData } = useDataQuery(eventsQuery(id));
    useEffect(() => {
    if (!loadingEvents && !errorEvents && eventsData?.events) {
        setEvents(eventsData.events.events);
        }   
        }, [eventsData, loadingEvents, errorEvents]);

    
    
    console.log('eventsData', eventsData)   
    const attributes = Object.entries(formFields).map(([attribute, value]) => ({ attribute, value }));

    const doMutation = async () => {
        try {
                        const response = await mutate({ orgUnit: defStaffOrgUnitId, attributes });
                        if (!response || (error && error.length > 0)) {
                            setResponseMessage('Failed to upload data');
                            console.error('Error:', error);
                        } else {
                            setResponseMessage('Data uploaded successfully!');
                            console.log(response);
                        }
                    } catch (error) {
                        setResponseMessage('An error occurred while uploading data');
                        console.error('Error:', error);
                    }
        
    }

    const handleFormSubmit = async (event) => {
        event.preventDefault();
        doMutation();
    };

    const handleInputChange = (event) => {
        console.log(event)

        const { name, value } = event.target;
        setFormFields(prevFields => ({
            ...prevFields,
            [name]: value,
        }));
        console.log('formfields', formFields)
    };

    const handleInputChangeSelect = (event) => {
        const { name, value } = event.target;
        //console.log(`Option ID/Code: ${name}, Option Name: ${value}`);
        setFormFields(prevFields => ({ ...prevFields, [name]: value }));
    };

    const [selected, setSelected] = useState([]);

    
    const onTreeChange = ({ selected }) => {
        setSelected(selected);
        console.log('selected:' , selected)

        setFormFields(prevFields => ({
            ...prevFields,
            [defLocationTEA]: selected[0], // assuming selected is an array and you want to store the first value
        }));
    }


    const { loading: loading1, error1, data } = useDataQuery(qryProgramFields, {
        variables: {
          id:  defStaffProgId, // Use the ID of the program you want to fetch
        },
    });

    
    const [events, setEvents] = useState([]);

    
    let transposedEvents = [];

    if (dataProgramDE && dataProgramDE.data && dataProgramDE.data.qPDE && dataProgramDE.data.qPDE.programStageDataElements) {
    transposedEvents = events.map(event => {
        const eventObj = { event: event.event };
        event.dataValues.forEach(dataValue => {
            const matchingElement = dataProgramDE.data.qPDE.programStageDataElements.find(element => element.dataElement.id === dataValue.dataElement);
            if (matchingElement) {
                eventObj[matchingElement.dataElement.displayName] = dataValue.value;
            }
        });
        return eventObj;
    });
    } else {}

    
 
   
    useEffect(() => {
        if (!loadingEntity && !errorEntity && dataEntity?.trackedEntityInstance?.attributes) {
            setTrackedEntityInstance(dataEntity.trackedEntityInstance.attributes);
        }
    }, [dataEntity, loadingEntity, errorEntity]);
    

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
        
        //Location return as array
        if(attributeId === defLocationTEA) {
            if(formFields[attributeId] !== undefined && formFields[attributeId] !== null && formFields[attributeId] !== '') {
                return [formFields[attributeId]];
            }
            else
            return [];
        }
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
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
  <div style={{ flex: '0 0 25%' }}>
    <h1>Staff Details</h1>

    {
      loading1 && 'Loading...'
    }

    {
      error && error.message
    }

    {
    // if there is any data available
    data?.program?.programTrackedEntityAttributes && (
            
        <form onSubmit={handleFormSubmit}>
            <table>

                <tbody>
                    {data.program.programTrackedEntityAttributes.map(({ trackedEntityAttribute }) => (
                    trackedEntityAttribute.name !== 'jtrain_staff_courses' && (
                        <tr key={trackedEntityAttribute.id}>
                            <td style={{ verticalAlign: 'top' }}>
                                <label>{trackedEntityAttribute.name}</label>
                            </td>
                            <td>
                            {trackedEntityAttribute.valueType === 'TEXT' ? (
                                    trackedEntityAttribute.id === defLocationTEA ? (
                                        <div>
                                        {
    findAttributeValue(trackedEntityAttribute.id)
        ? findAttributeValue(trackedEntityAttribute.id)
            .toString()
            .split('/')
            .slice(2)
            .map(id => {
                const orgUnit = orgUnitsData.orgUnits.organisationUnits.find(orgUnit => orgUnit.id === id);
                return orgUnit ? orgUnit.displayName : id;
            })
            .join(' - ')
        : ''
}
            <button onClick={() => setShowTree(!showTree)}>
                 Change Location
            </button>
            {showTree && 
                                             <OrganisationUnitTree
                                                // initiallyExpanded={[defStaffOrgUnitId]}
                                                initiallyExpanded={findAttributeValue(trackedEntityAttribute.id)}
                                                roots={defStaffOrgUnitId} // replace with your root organisation unit ID
                                                selected={findAttributeValue(trackedEntityAttribute.id)}
                                                onChange={onTreeChange}
                                                singleSelection
                                            />}
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
                        </tr>
                    )
                ))}
            </tbody>
            </table>
            <button type="submit"><IconSave16 /> Save</button>
            <Link to="/staffsearch">
                <button type="button"><IconCross16 />Close</button>
            </Link>
            <button type="button" onClick={handleDelete}><IconDelete16 /> Delete</button>
            <p>{responseMessage}</p>
            
            
   
        </form>

        
    )
}
  </div>
  <div style={{ flex: '0%' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2>Courses</h2>
        {/* <Link to="/trainingcapture">
            <button style={{
            background: 'linear-gradient(to right, darkblue, cyan)',
            border: 'none',
            color: 'white',
            padding: '15px 32px',
            textAlign: 'center',
            textDecoration: 'none',
            display: 'inline-block',
            fontSize: '16px',
            borderRadius: '12px'
            }}>Go to Training Capture</button>
        </Link> */}
        </div>
    <table>
 
<thead>
<tr>

</tr>
</thead>
<tbody>
{transposedEvents.length > 0 ? (
  transposedEvents.map((eventObj, index) => (
    <tr key={eventObj.event}>

        <td>
        {dataProgramDE?.data?.qPDE?.programStageDataElements.map(({ dataElement }, cellIndex) => (
        <div>
            <div key={dataElement.id} style={{ textAlign: 'center' }}>
                {!dataElement.displayName.startsWith('jTrain') && (cellIndex === 0 ? <CourseDetailsStaffView course={eventObj[dataElement.displayName]} /> : '' )}
            </div>
        </div>
        
      ))}
      
      { dataProgramDE?.data?.qPDE?.programStageDataElements.map(({ dataElement }, cellIndex) => (
    <div>
        <div key={dataElement.id} style={{ textAlign: 'center' }}>
            {!dataElement.displayName.startsWith('jTrain') && (cellIndex === 0 ? <CourseDateAttendeesStaffCustomFields eventID={eventObj.event} /> : '')}
        </div>
    </div>
))}
           
        </td>
      
    </tr>
  ))
) : (
  <p>No Courses attended</p>
)}
</tbody>
    </table>
  </div>
  </div>
)
}


