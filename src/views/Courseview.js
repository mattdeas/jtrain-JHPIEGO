import { useDataQuery, useDataMutation, useDataEngine } from '@dhis2/app-runtime';
import { CourseDetailsCourseView } from './CourseDetailsCourseView';
import { BrowserRouter as Router, Route, Link, Routes, useLocation , useParams} from 'react-router-dom';
import React, {useState, useEffect} from 'react'

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





const eventsQuery = (id) => ({
    events: {
        resource: 'events',
        params: {
            trackedEntityInstance: id,
            fields: ['event', 'status', 'program', 'orgUnit', 'dataValues[dataElement,value]'],
        },
    },
});
const dataElementQuery = {
    dataElement: {
        resource: 'dataElements',
        id: '{id}', // replace with the actual dataElement ID
        params: {
            fields: ['displayName'],
        },
    },
};

const DataElement = ({ dataElementId, value }) => {
    const dataElementQuery = {
        dataElement: {
            resource: 'dataElements',
            id: dataElementId,
            params: {
                fields: ['displayName'],
            },
        },
    };

    const { loading, error, data } = useDataQuery(dataElementQuery);

    if (loading) return <td>Loading...</td>;
    if (error) return <td>Error: {error.message}</td>;

    return (
        <>
            <td>{data.dataElement.displayName}</td>
            <td>{value}</td>
        </>
    );
};

const mutationWorking = {
    resource: 'programs',
    id: ({ id }) => id,
    type: 'update',
    partial: true,
    data: ({ name }) => ({
        name,
    }),
}

const mutation = {
    resource: 'trackedEntityInstances',
    id: ({ id }) => id,
    type: 'update',
    data: ({ orgUnit, attributes }) => ({
        orgUnit,
        attributes,
    }),
}

const qryProgramDataElements = {
    "qPDE": {
        resource: 'programStages',
           "id": 'r0gHZqEq6DE',
           "params": {
               "fields": "programStageDataElements[program[id,P59PhQsB6tb],dataElement[id,displayName,valueType],sortOrder]",
           },

    },
}

// const mutationCourseEvent = {
//     resource: 'events',
//     type: 'create',
//     data: ({ trackedEntityInstance }) => ({
//         events: [
//             {
//                 trackedEntityInstance: 'bQD9iDVR7E3',
//                 program: 'P59PhQsB6tb',
//                 programStage: 'r0gHZqEq6DE',
//                 orgUnit: 'VgrqnQEtyOP',
//                 dataValues: [
//                     {
//                         dataElement: 'I3k1jlogV15',
//                         value: '2024-01-01',
//                     },
//                     {
//                         dataElement: 'ahGuEZrtqR5',
//                         value: '2024-01-01',
//                     },
//                     {
//                         dataElement: 'WYM1k90FCf7',
//                         value: 'Testy McTestface',
//                     }
//                 ],
//                 status: 'ACTIVE',
//                 eventDate: formattedDate,
//             },
//         ],
//     }),
// };

// const mutationCourseEvent = {
//     resource: 'events',
//     type: 'create',
//     data: ({ trackedEntityInstance, dataValues }) => ({
//       events: [
//         {
//           trackedEntityInstance: 'bQD9iDVR7E3',
//           program: 'P59PhQsB6tb',
//           programStage: 'r0gHZqEq6DE',
//           orgUnit: 'VgrqnQEtyOP',
//           dataValues: dataValues,
//           status: 'ACTIVE',
//           eventDate: formattedDate,
//         },
//       ],
//     }),
//   };


const mutationCourseEvent = (program, programStage, orgUnit, trackedEntityInstance, idataValues) => ({
    resource: 'events',
    type: 'create',
    data: () => ({
      events: [
        {
          trackedEntityInstance: trackedEntityInstance,
          program: program,
          programStage: programStage,
          orgUnit: orgUnit,
          dataValues: idataValues,
          status: 'ACTIVE',
          eventDate: formattedDate,
        },
      ],
    }),
  });


export const Courseview = () => {
    const { id } = useParams();
    const [refreshKey, setRefreshKey] = useState(0);
    const dSysConstants = useDataQuery(qryConstants)
    const [trackedEntityInstance, setTrackedEntityInstance] = useState(null);
    const [formFields, setFormFields] = useState({});
    const [formFieldsCourse, setFormFieldsCourse] = useState({});
    const [mutate, { loading, error }] = useDataMutation(mutation)
    const { loading: loadingEntity, error: errorEntity, data: dataEntity } = useDataQuery(qryTrackedEntityInstance, {
        variables: {
         id,
        },
    });

    const [showSection, setShowSection] = useState(false);

    const deleteMutation = {
        resource: 'trackedEntityInstances',
        id: id,
        type: 'delete',
    };

    

  const { loading: loading2, error2, data: dataProgramDE } = useDataQuery(qryProgramDataElements);
  
  const engine = useDataEngine();

  const handleDelete = async () => {
      if (window.confirm('Are you sure you want to delete this course?')) {
          try {
              await engine.mutate(deleteMutation);
              alert('Course deleted successfully');
          } catch (error) {
              alert('Failed to delete course');
          }
      }
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
const handleInputChangeCourse = (name, value) => {
    console.log(name, value)

    // const { name, value } = event.target;
    setFormFieldsCourse(prevFields => ({
        ...prevFields,
        [name]: value,
    }));

}


      const handleInputChangeSelect = (event) => {
        const { name, value } = event.target;
        //console.log(`Option ID/Code: ${name}, Option Name: ${value}`);
        setFormFields(prevValues => ({ ...prevValues, [name]: value }));
    };
    
    const [createEvent, { dataEvent, loadingEvent, errorEvent }] = useDataMutation(mutationCourseEvent);

    // const handleSave = async (trackedEntityInstance) => {
    
    //     // const type = 'ZBUwOGosqI0';
    //     // const { error: relationshipsError, data: relationshipsData } = await mutateRelationships({ trackedEntityInstance, eventID, type});
    //     // if (relationshipsError) {
    //     //     console.error('Error creating relationship:', relationshipsError);
    //     // } else {
    //     //     console.log('Relationship created successfully');
    //     //     console.log('Relationship data:', relationshipsData);
    //     // }
    
    //     const dataValues = Object.entries(formFieldsCourse).map(([dataElement, value]) => ({ dataElement, value }));
    //     //trackedEntityInstance: 'bQD9iDVR7E3',
    //     //           program: 'P59PhQsB6tb',
    //     //           programStage: 'r0gHZqEq6DE',
    //     //           orgUnit: 'VgrqnQEtyOP',
    //     //           dataValues: dataValues,
    //     //           status: 'ACTIVE',
    //     //           eventDate: formattedDate,

    //     const myMutation = mutationCourseEvent('P59PhQsB6tb', 'r0gHZqEq6DE', 'VgrqnQEtyOP', trackedEntityInstance, dataValues);
    //     const { error } = await createEvent({ trackedEntityInstance, dataValues });
    //     console.log('CreateEvent', createEvent)
    //     if (error) {
    //         console.error('Error creating event:', error);
    //     } else {
    //         console.log('Event created successfully');
    //     }
    // };

    

      const handleSave = async () => {
        const dataValues = Object.entries(formFieldsCourse).map(([dataElement, value]) => ({ dataElement, value }));
        
        //Default values for Course Attendees and Counts

        dataValues.push({ dataElement: 'l9aHlXLsEyE', value: '' });
        dataValues.push({ dataElement: 'Av9iXMiGRou', value: '0' });
        const myMutation = mutationCourseEvent('P59PhQsB6tb', 'r0gHZqEq6DE', 'VgrqnQEtyOP', id, dataValues);
        console.log(dataValues)
        try {
          const response = await engine.mutate(myMutation);
          console.log('Event created successfully', response);
          
          // Increment refreshKey to force a re-render of CourseDetailsCourseView
          // setRefreshKey(prevKey => prevKey + 1);
          // Refresh the page
         window.location.reload();
        } catch (error) {
          console.error('Error creating event:', error);
        }
      };
    
    <button onClick={() => handleAssign(trackedEntityInstance)}>
                                Assign
                            </button>
    
  const handleButtonClick = () => {
    setShowSection(true);
  };

    const [responseMessage, setResponseMessage] = useState('');
    const { loading: loadingEvents, error: errorEvents, data: eventsData } = useDataQuery(eventsQuery(id));
    useEffect(() => {
    if (!loadingEvents && !errorEvents && eventsData?.events) {
        console.log('eventsDataevents',eventsData)
        setEvents(eventsData.events.events);
        }   
        }, [eventsData, loadingEvents, errorEvents]);


    let defOrgUnit = null;
    if (dSysConstants && dSysConstants.data && dSysConstants.data.attributes && dSysConstants.data.attributes.constants) {
        const defOrgUnitObj = dSysConstants.data.attributes.constants.find(constant => constant.displayName === 'jtrain-DefaultStaffOrgUnit');
        defOrgUnit = defOrgUnitObj ? defOrgUnitObj.code : null;
    }
    
    const attributes = Object.entries(formFields).map(([attribute, value]) => ({ attribute, value }));

    const doMutation = async () => {
        try {
                        // Pass the mutation object to the mutate function
                        //const response = await mutate(MutateTEI);
                        const response = await mutate({ id: id,
                         orgUnit: defOrgUnit, 
                         attributes });
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

    let staffMemberid, defaultStaffOrgUnit, defaultStaffProg;
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
    }

    const { loading: loading1, error1, data } = useDataQuery(qryProgramFields, {
        variables: {
          id:  "P59PhQsB6tb", // Use the ID of the program you want to fetch
        },
    });

    
    const [events, setEvents] = useState([]);

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
  <div style={{ flex: '0 0 50%' }}>
  
    <h1>Course Details</h1>

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
                <thead>
                    <tr>
                        {/* <th >ID</th> */}
                        <th>Variable</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    {data.program.programTrackedEntityAttributes.map(({ trackedEntityAttribute }) => (
                    trackedEntityAttribute.name !== 'jtrain_staff_courses' && (
                        <tr key={trackedEntityAttribute.id}>
                            {/* <td style={{width: '0px'}}>{trackedEntityAttribute.id}</td> */}
                            <td>
                                <label>{trackedEntityAttribute.name}</label>
                            </td>
                            <td>
                                {trackedEntityAttribute.valueType === 'TEXT' ? (
                                    trackedEntityAttribute.optionSet && trackedEntityAttribute.optionSet.options ? (
                                        <select name={trackedEntityAttribute.id} onChange={handleInputChangeSelect}>
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
                    )
                ))}
            </tbody>
            </table>
            <button type="submit">Save</button>
            <Link to="/coursesearch">
                <button type="button">Close</button>
            </Link>
            <button type="button" onClick={handleDelete}>Delete</button>
            <p>{responseMessage}</p>
            
            
   
        </form>

        
    )
}
  </div>
  <div style={{ display: 'flex', flexDirection: 'column' }}>
  <div style={{ width: '100%', height: '70%', overflow: 'auto' }}>
    <p style={{ alignContent: 'center', paddingLeft: '25%'}} >Course Details</p>
    {
    eventsData?.events?.events?.length > 0 && (
      <table>
        <tbody>
          {eventsData.events.events.map((event) => (
            <tr key={event.event}>
               {/* <td>{event.event}</td> */}
              <td><CourseDetailsCourseView id={event.event} key={refreshKey}/></td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }</div>
  <div>
  {!showSection && <button onClick={handleButtonClick}>New Course Dates</button>}
  {showSection && dataProgramDE && (
    <>
      <table>
        <thead>
          {/* <tr>
            <th>Variable</th>
            <th>Value</th>
          </tr> */}
        </thead>
        <tbody>
        {dataProgramDE.qPDE.programStageDataElements.map((item, index) => {
            if (item.dataElement.displayName.startsWith('jtrain')) {
                return null;
            }

            return (
                <tr key={item.dataElement.id}>
                <td>{item.dataElement.displayName}</td>
                <td>
                    {item.dataElement.valueType === 'DATE' ? (
                        <input type="date" onChange={e => handleInputChangeCourse(item.dataElement.id, e.target.value)}  />
                    ) : item.dataElement.valueType === 'TEXT' ? (
                    <input type="text"  onChange={e => handleInputChangeCourse(item.dataElement.id, e.target.value)}  />
                    ) : (
                    item.dataElement.valueType
                    )}
                </td>
                </tr>
            );
            })}
        </tbody>
      </table>
      <button onClick={() => setShowSection(false)}>Cancel</button>
      <button onClick={handleSave}>Save</button>
    </>
  )}
</div>
    </div>
  </div>
)
}


