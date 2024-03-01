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

const mutationIndicator = {
    resource: 'trackedEntityInstances',
    id: ({ trackedEntityInstance }) => trackedEntityInstance,
    type: 'update',
    partial: true,
    data: ({ orgUnit, trackedEntityType, attributes }) => ({
        orgUnit,
        trackedEntityType,
        attributes,
    }),
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

const createMutation = (id, attributes) => ({
    resource: 'trackedEntityInstances',
    type: 'update',
    id: id,
    data: {
        orgUnit: 'VgrqnQEtyOP',
        attributes: Object.entries(attributes).map(([attribute, value]) => ({ attribute, value }))
    },
});

const mutation = {
    resource: 'trackedEntityInstances',
    type: 'create',
    data: ({ orgUnit, attributes }) => ({
        orgUnit,
        attributes,
    }),
}

export const Staff_add = () => {
    const dSysConstants = useDataQuery(qryConstants)
    const [trackedEntityInstance, setTrackedEntityInstance] = useState(null);
    const [formFields, setFormFields] = useState({});
    const [mutate, { loading, error }] = useDataMutation(mutation)

     const qryProgramDataElements = {
         "qPDE": {
             resource: 'programStages',
                "id": 'Y6scAJvghc0',
                "params": {
                    "fields": "programStageDataElements[program[id,Ss21byybIqu],dataElement[id,displayName],sortOrder]",
                },

         },
    }

    const dataProgramDE  = useDataQuery(qryProgramDataElements);

    console.log('dataProgramDE', dataProgramDE)

    const { loading: loadingDataElement, error: errorDataElement, data: dataElementData } = useDataQuery(dataElementQuery);
    console.log('dsysContstants',dSysConstants)
    const [responseMessage, setResponseMessage] = useState('');
    const { loading: loadingEvents, error: errorEvents, data: eventsData } = useDataQuery(eventsQuery(id));
    useEffect(() => {
    if (!loadingEvents && !errorEvents && eventsData?.events) {
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
                        const response = await mutate({ 
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

    const handleInputChange = (event) => {
        console.log(event)

        const { name, value } = event.target;
        console.log('value', value)
        setFormFields(prevFields => ({
            ...prevFields,
            [name]: value,
        }));
        console.log('formfields', formFields)
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
          id:  "Ss21byybIqu", // Use the ID of the program you want to fetch
        },
    });

    
    const [events, setEvents] = useState([]);

    const transposedEvents = events.map(event => {
        const eventObj = { event: event.event };
        event.dataValues.forEach(dataValue => {
            if (dataProgramDE && dataProgramDE.data && dataProgramDE.data.qPDE) {
                const matchingElement = dataProgramDE.data.qPDE.programStageDataElements.find(element => element.dataElement.id === dataValue.dataElement);
                if (matchingElement) {
                    eventObj[matchingElement.dataElement.displayName] = dataValue.value;
                    eventObj.sortOrder = matchingElement.sortOrder;
                }
            }
        });
        return eventObj;
    });

    

    let sortedProgramStageDataElements = [];
    if (dataProgramDE && dataProgramDE.data && dataProgramDE.data.qPDE) {
        sortedProgramStageDataElements = [...dataProgramDE.data.qPDE.programStageDataElements].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    
    // Create a new array where each element is an object with properties for each data value
    // const transposedEvents = events.map(event => {
    //     const eventObj = { event: event.event };
    //     event.dataValues.forEach(dataValue => {
    //         const matchingElement = sortedProgramStageDataElements.find(element => element.dataElement.id === dataValue.dataElement);
    //         if (matchingElement) {
    //             eventObj[matchingElement.dataElement.displayName] = dataValue.value;
    //         }
    //     });
    //     return eventObj;
    // });
   
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
      //https://dhis2.af.jhpiego.org/api/programStages/ud3llulRwwt?fields=programStageDataElements
//https://dhis.tz.jhpiego.org/api/programStages/CVIIukA6xQx.json?fields=programStageDataElements[dataElement[name,id]]
    }

    {
    // if there is any data available
    data?.program?.programTrackedEntityAttributes && (
        <form onSubmit={handleFormSubmit}>
            <table>
                <thead>
                    <tr>
                        {/* <th >ID</th> */}
                        <th>Name</th>
                        <th>Value Type</th>
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
                    )
                ))}
            </tbody>
            </table>
            <button type="submit">Submit</button>
            <p>{responseMessage}</p>
            <h2>Courses</h2>
            <Link to="/trainingcapture">
    <button>Go to Training Capture</button>
</Link>
            
    <table>
        <thead>
            <tr>
                {transposedEvents[0] && Object.keys(transposedEvents[0]).map(key => key !== 'event' && key !== 'sortOrder' && <th key={key}>{key}</th>)}
            </tr>
        </thead>
        <tbody>
            {transposedEvents.map((eventObj, index) => (
                <tr key={index}>
                    {/* <td>{eventObj.event}</td> */}
                    {Object.keys(eventObj).map(key => key !== 'event' && key !== 'sortOrder' && <td key={key}>{eventObj[key]}</td>)}
                </tr>
            ))}
        </tbody>

        </table>
        </form>

        
    )
}
  </div>
)
}
