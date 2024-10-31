import { useDataQuery, useDataMutation, useDataEngine } from '@dhis2/app-runtime';
import { CourseDetailsCourseView } from './CourseDetailsCourseView';
import { CourseDateAttendees } from './CourseDateAttendees';
import { CourseDateStaffShow } from './CourseDate-StaffShow';
import { BrowserRouter as Router, Route, Link, Routes, useLocation , useParams} from 'react-router-dom';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import React, {useState, useEffect} from 'react'
import { utilConfigConstantValueByName } from '../utils/utils';
import { CourseEditEvent} from './CourseEditEvent'
import { Calendar } from '@dhis2-ui/calendar'
import { IconAdd16, IconDelete16, IconCross16, IconSave16, IconView16, IconEdit16 , IconArrowLeftMulti24} from '@dhis2/ui';
import { CalendarInput } from '@dhis2/ui';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { OrganisationUnitTree } from '@dhis2/ui';

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

const defCourseOrgUnitId = utilConfigConstantValueByName('DefaultCourseOrgUnit')
    const defCourseProgramId = utilConfigConstantValueByName('CourseProgram')
    const defCourseProgStageId = utilConfigConstantValueByName('CourseProgramStageId')




const qryTrackedEntityInstance = {
    trackedEntityInstance: {
        resource: 'trackedEntityInstances',
        id: ({ id }) => id,
        params: {
            fields: ['attributes[attribute,value]'],
            program: defCourseProgramId
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

const mutation = {
    resource: 'trackedEntityInstances',
    id: ({ id }) => id,
    type: 'update',
    data: ({ orgUnit, attributes }) => ({
        orgUnit,
        attributes,
    }),
}




const mutationCourseEvent = (program, programStage, orgUnit, trackedEntityInstance, idataValues, eventDate) => ({
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
          eventDate: eventDate,
        },
      ],
    }),
  });
  const ORG_UNITS_QUERY = {
    orgUnits: {
        resource: 'organisationUnits',
        params: {
            paging: false,
        },
    },
};

export const Courseview = () => {
    const { id } = useParams();
    const [refreshKey, setRefreshKey] = useState(0);
    const [trackedEntityInstance, setTrackedEntityInstance] = useState(null);
    const [formFields, setFormFields] = useState({});
    const [formFieldsCourse, setFormFieldsCourse] = useState({});
    const [formFieldsCourseEdit, setFormFieldsCourseEdit] = useState({});
    const [dateFields, setDateFields] = useState({});
    const [showTree, setShowTree] = useState(false);

    const [isViewClicked, setisViewClicked] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editCourseShow, setEditCourseShow] = useState(false);
    const [mutate, { loading, error }] = useDataMutation(mutation)

    const defCourseOrgUnit = utilConfigConstantValueByName('DefaultCourseOrgUnit')
    const defLocationDE = utilConfigConstantValueByName('LocationDE')
    const defCourseEndDate =  utilConfigConstantValueByName('CourseEndDate')

    const { loading: orgUnitsLoading, error: orgUnitsError, data: orgUnitsData } = useDataQuery(ORG_UNITS_QUERY);
    const navigate = useNavigate(); 
    const [key, setKey] = useState(0); 

    const { loading: loadingEntity, error: errorEntity, data: dataEntity } = useDataQuery(qryTrackedEntityInstance, {
        variables: {
         id,
        },
    });

    const qryProgramFields = {
        program: {
          resource: 'programs',
          id: ({ id }) => id,
          params: {
            fields: ['id', 'name', 'programTrackedEntityAttributes[sortOrder,trackedEntityAttribute[id,name,valueType,mandatory,optionSet[id,name,options[id,code,name,displayName]]]]'],
          },
        },
    };

    

    const qryProgramDataElements = {
        "qPDE": {
            resource: 'programStages',
               "id": defCourseProgStageId,
               "params": {
                   "fields": `programStageDataElements[program[id,${defCourseProgramId}],dataElement[id,displayName,valueType],sortOrder]`,
               },
    
        },
    }
    
    const [showSection, setShowSection] = useState(false);
    const [showSectionEdit, setShowSectionEdit] = useState(false);
    const [selectedEditEventDE, setSelectedEditEventDE] = useState(null);
    const [selectedLocationName, setSelectedLocationName] = useState('');

    const deleteMutation = {
        resource: 'trackedEntityInstances',
        id: id,
        type: 'delete',
    };


  const { loading: loading2, error2, data: dataProgramDE } = useDataQuery(qryProgramDataElements);
  
  const engine = useDataEngine();
//Possibly hold off on this - functionality via jTRAIN.
  const handleDelete = async () => {
      if (window.confirm('Are you sure you want to delete this course? NOTE - THIS WILL REMOVE ALL TRAINEE DATA FOR THIS COURSE')) {
          try {
              await engine.mutate(deleteMutation);
              alert('Course deleted successfully');
          } catch (error) {
              alert('Failed to delete course');
          }
      }
  };

  const deleteEvent = async (eventToDelete) => {
    try {
        const mutation = {
            resource: 'events',
            id: eventToDelete, // Replace with the correct property for the event ID
            type: 'delete',
        };

        const result = await engine.mutate(mutation);

        if (result.status === 'OK') {
            console.log('Event deleted successfully');
            refetchEvent();
        } else {
            console.log('Failed to delete event');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
    }
};
     


  const handleDeleteEvent = (eventToDelete) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this event?");
    if (confirmDelete) {
        console.log('eventtodel',eventToDelete)
        deleteEvent(eventToDelete);
    }
};


const handleAddTrainees = (eventToDelete) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this event?");
    if (confirmDelete) {
        console.log('eventtodel',eventToDelete)
        deleteEvent(eventToDelete);
    }
};
  const handleEditEvent = (event) => {
    const dataValuesObject = event.dataValues.reduce((acc, { dataElement, value }) => {
        acc[dataElement] = value;
        return acc;
    }, {});


    const selectedLocation = dataValuesObject[defLocationDE]; // Extract the last value
    if (selectedLocation) {
        setSelectedLocationName(
            selectedLocation
                .toString()
                .split('/')
                .slice(2)
                .map(id => {
                    const orgUnit = orgUnitsData?.orgUnits?.organisationUnits?.find(orgUnit => orgUnit.id === id);
                    return orgUnit ? orgUnit.displayName : id;
                })
                .join(' - ')
        );
    } else {
        setSelectedLocationName('');
    }


    setSelected(selectedLocation ? [selectedLocation] : [])
    console.log(selectedLocation)
    setSelectedEditEventDE(dataValuesObject);
    setSelectedEditEvent(event);
    setFormFieldsEdit(dataValuesObject);
    setShowSectionEdit(true);
    setIsEditing(true);
    console.log('selectedEditEventDE',selectedEditEventDE)
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
const [selected, setSelected] = useState([]);

const onTreeChange = ({ selected }) => {
    setSelected(selected);

    setFormFieldsCourse(prevFields => ({
        ...prevFields,
        [defLocationDE]: selected[0], // assuming selected is an array and you want to store the first value
    }));
}

const onTreeChangeEdit = ({ selected }) => {
    setSelected(selected);

    setFormFieldsEdit(prevFields => ({
        ...prevFields,
        [defLocationDE]: selected[0], // assuming selected is an array and you want to store the first value
    }));
}

const handleInputChangeCourseDate = (name, date) => {
    if (date) {
        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        console.log(name, value)


        setFormFieldsCourse(prevFields => ({
            ...prevFields,
            [name]: value,
        }));

        setDateFields(prevFields => ({
            ...prevFields,
            [name]: value,
        }));
    }
};

const handleInputChangeCourseDateEdit = (name, date) => {
    if (date) {
        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        setFormFieldsEdit(prevFields => ({
            ...prevFields,
            [name]: value,
        }));

        setDateFields(prevFields => ({
            ...prevFields,
            [name]: value,
        }));
    }
};


      const handleInputChangeSelect = (event) => {
        const { name, value } = event.target;
        //console.log(`Option ID/Code: ${name}, Option Name: ${value}`);
        setFormFields(prevValues => ({ ...prevValues, [name]: value }));
    };
    
    const [createEvent, { dataEvent, loadingEvent, errorEvent }] = useDataMutation(mutationCourseEvent);

      const handleSave = async () => {
        const dataValues = Object.entries(formFieldsCourse).map(([dataElement, value]) => ({ dataElement, value }));
        
        //Default values for Course Attendees and Counts
        const defCourseAttendeesId = utilConfigConstantValueByName('CourseAttendees')
        const defCourseAttendeesCountId = utilConfigConstantValueByName('CourseAttendeesCount')
        const defCourseStartDate = utilConfigConstantValueByName('CourseStartDate')
        dataValues.push({ dataElement: defCourseAttendeesId, value: '' });
        dataValues.push({ dataElement: defCourseAttendeesCountId, value: '0' });

        const eventDateValue = formFieldsCourse[defCourseStartDate];
        const eventDate = eventDateValue ? eventDateValue : formattedDate; // Use the extracted date or fallback to today's date
        
        const myMutation = mutationCourseEvent(defCourseProgramId, defCourseProgStageId, defCourseOrgUnitId, id, dataValues, eventDate);
        console.log(dataValues)
        try {
          const response = await engine.mutate(myMutation);
          console.log('Event created successfully', response);
          
           // Navigate to the same page to refresh the content
           // Update the key state variable to force a re-render
           refetchEvent();
           setShowSection(false);
           setKey(prevKey => prevKey + 1);
           
        } catch (error) {
          console.error('Error creating event:', error);
        }
      };

      const handleSaveEdit = async () => {
        const dataValues = Object.entries(formFieldsEdit).map(([dataElement, value]) => ({ dataElement, value }));
    console.log('selectedEditEvent',selectedEditEvent.event)
        // Default values for Course Attendees and Counts
        //const defCourseAttendeesId = utilConfigConstantValueByName('CourseAttendees');
        //const defCourseAttendeesCountId = utilConfigConstantValueByName('CourseAttendeesCount');
        //dataValues.push({ dataElement: defCourseAttendeesId, value: '' });
        //dataValues.push({ dataElement: defCourseAttendeesCountId, value: '0' });
    
        // Create the mutation for updating the event
        const updateEventMutation = {
            resource: 'events',
            type: 'update',
            id: selectedEditEvent.event, // Assuming selectedEditEvent contains the event ID
            data: {
                program: defCourseProgramId,
                programStage: defCourseProgStageId,
                orgUnit: defCourseOrgUnitId,
                trackedEntityInstance: id,
                dataValues: dataValues,
                status: 'ACTIVE',
                eventDate: formattedDate,
            },
        };
    
        console.log(dataValues);
    
        try {
            const response = await engine.mutate(updateEventMutation);
            console.log('Event updated successfully', response);
    
            // Refresh the page
            refetchEvent();
            setShowSectionEdit(false);
            setKey(prevKey => prevKey + 1);
        } catch (error) {
            console.error('Error updating event:', error);
        }
        setIsEditing(false);
    };
    
    <button onClick={() => handleAssign(trackedEntityInstance)}>
                                Assign
                            </button>
    
  const handleButtonClick = () => {
    setShowSection(true);
  };

  

    const [responseMessage, setResponseMessage] = useState('');
    const { loading: loadingEvents, error: errorEvents, data: eventsData, refetch: refetchEvent } = useDataQuery(eventsQuery(id));

    useEffect(() => {
        if (!loadingEvents && !errorEvents && eventsData?.events) {
            console.log('eventsDataevents', eventsData);
            
            // Sort events based on the date value of the dataElement "ODO4HZT4XSg"
            const sortedEvents = eventsData.events.events.sort((a, b) => {
                const dateA = new Date(a.dataValues.find(dv => dv.dataElement === defCourseEndDate)?.value);
                const dateB = new Date(b.dataValues.find(dv => dv.dataElement === defCourseEndDate)?.value);
                return dateB - dateA;
            });
    
            setEvents(sortedEvents);
        }   
    }, [eventsData, loadingEvents, errorEvents]);
    
    
    useEffect(() => {
    if (!loadingEvents && !errorEvents && eventsData?.events) {
        console.log('eventsDataevents',eventsData)
        setEvents(eventsData.events.events);
        }   
        }, [eventsData, loadingEvents, errorEvents]);

    const attributes = Object.entries(formFields).map(([attribute, value]) => ({ attribute, value }));

    const doMutation = async () => {
        try {
                        // Pass the mutation object to the mutate function
                        const response = await mutate({ id: id,
                         orgUnit: defCourseOrgUnitId, 
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

    
    const { loading: loading1, error1, data } = useDataQuery(qryProgramFields, {
        variables: {
          id:  defCourseProgramId, // Use the ID of the program you want to fetch
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


    const findAttributeValueEdit = (attributeId) => {
        
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

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedEditEvent, setSelectedEditEvent] = useState(null);

    const handleViewClick = (event) => {
        setSelectedEvent(event);
        setisViewClicked(true)
        console.log('ViewEvent',event)
    };

    const hideCourseDateShow = (event) => {
        setisViewClicked(false)
        setSelectedEvent(null)
        console.log('ViewEvent',event)
    };

    const [filterDate, setFilterDate] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [partnerFilter, setPartnerFilter] = useState('');
    const [values, setValues] = useState({ location: '', partner: '' });

    const handleTextChange = (event) => {
        const { name, value } = event.target;
        setValues({
            ...values,
            [name]: value,
        });
        if (name === 'location') {
            setLocationFilter(value);
        } else if (name === 'partner') {
            setPartnerFilter(value);
        }
    };



    
    const handleFilterCourseDate = (date) => { 
        setFilterDate(date);
    };
    const [formFieldsEdit, setFormFieldsEdit] = useState(selectedEditEventDE || {});

    const handleInputChangeCourseEdit = (dataElementId, value) => {
        setFormFieldsEdit(prevFields => ({
            ...prevFields,
            [dataElementId]: value,
        }));
    };
    // const filterEvents = (events, partnerFilter, filterDate) => {
    //     return events.filter(event => {
    //         const dataValues = event.dataValues.reduce((acc, dataValue) => {
    //             acc[dataValue.dataElement] = dataValue.value;
    //             return acc;
    //         }, {});
    
    //         const partnerMatch = dataValues['hGGDYuGuVeX'] ? dataValues['hGGDYuGuVeX'].toLowerCase().includes(partnerFilter.toLowerCase()) : false;
    
    //         const startDate = new Date(dataValues['N3rXacKJAjy']);
    //         const endDate = new Date(dataValues['ODO4HZT4XSg']);
    //         const filterDateParsed = filterDate ? new Date(filterDate) : null;
    
    //         const dateMatch = filterDateParsed ? (filterDateParsed >= startDate && filterDateParsed <= endDate) : false;
    
    //         if (!partnerFilter && filterDateParsed) {
    //             return dateMatch;
    //         } else if (partnerFilter && !filterDateParsed) {
    //             return partnerMatch;
    //         } else {
    //             return partnerMatch || dateMatch;
    //         }
    //     });
    // };
    
    //const filteredEvents = filterEvents(eventsData.events.events, partnerFilter, filterDate);
    //console.log('filteredEvents',filteredEvents)
    return (
        <div key={key}  style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex' }}>
                <div style={{ flex: '0 0 25%', minHeight: '90vh' }}>
  
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
                
                <tbody>
                    {data.program.programTrackedEntityAttributes.map(({ trackedEntityAttribute }) => (
                    trackedEntityAttribute.name !== 'jtrain_staff_courses' && (
                        <tr key={trackedEntityAttribute.id}>
                            {/* <td style={{width: '0px'}}>{trackedEntityAttribute.id}</td> */}
                            <td>
                                <label>{trackedEntityAttribute.name}</label>
                               
                            </td>
                            <td>
                                {
                                    trackedEntityAttribute.valueType === 'TEXT' ? (
                                    trackedEntityAttribute.optionSet && trackedEntityAttribute.optionSet.options ? (
                                        <select 
                                        name={trackedEntityAttribute.id} 
                                        onChange={handleInputChangeSelect}
                                        value={findAttributeValue(trackedEntityAttribute.id)}>
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
            <div>
                {!editCourseShow && (
                    <div>
                        {/* <button type="button" >Edit Course Details</button> */}
                        <Link to="/coursesearch">
                        <button type="button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconArrowLeftMulti24 style={{ marginRight: '8px' }} /> Return to Search
                        </button>
                        </Link>
                    </div>
                )}
                {editCourseShow && (
                    <div>                   
                        <button type="submit"><IconSave16 /> Save</button>
                        <Link to="/coursesearch">
                            <button type="button"><IconCross16/> Close / Cancel </button>
                        </Link>
                        <button type="button" onClick={handleDelete}><IconDelete16 /> Delete</button>
                    </div>
                )}
                
            </div>
            
            <p>{responseMessage}</p>
            
            
   
        </form>

        
    )
}
{selectedEvent &&  (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', margin: 0, padding: 0 }}>
    <CourseDateStaffShow key={selectedEvent} tei_id={id} eventID={selectedEvent} />
    <CourseDateAttendees key={selectedEvent} eventID={selectedEvent} dElements={null} />
    <button onClick={hideCourseDateShow} style={{ width: '100px', margin: 0, padding: 0 }}>Close</button>        
    </div>

)}
                </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
            <p style={{ alignContent: 'center', paddingLeft: '25%', paddingTop: '20px', fontWeight: 'bold' }}>Course Events</p>
                <div style={{ width: '100%', height: '70%', overflow: 'auto' }}>
                {!isViewClicked && (
                    <div>
                    {/* <div>
                                        <label>
                                            Date:
                                            <DatePicker
                                                selected={filterDate}
                                                onChange={(date) => handleFilterCourseDate(date)}
                                                dateFormat="yyyy-MM-dd"
                                                placeholderText='YYYY-MM-DD'
                                            />
                                        </label>
                                        <label>
                                            Partner:
                                            <input
                                                type="text"
                                                name="partner"
                                                value={values.partner}
                                                onChange={handleTextChange}
                                            />
                                        </label>
                                        <label>
                                            Location:
                                            <input
                                                type="text"
                                                name="location"
                                                value={values.location}
                                                onChange={handleTextChange}
                                            />
                                        </label>
                                    </div> */}
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    
    {
        eventsData?.events?.events?.length > 0 ? (
            <table style={{ border: '1px solid lightgray', borderCollapse: 'collapse' }}>
                <tbody>
                    {eventsData.events.events.map((event) => (
                        <tr key={event.event}>
                            <td ><CourseDetailsCourseView id={event.event} key={refreshKey}/></td>
                            <td >
                                <div role="button" tabIndex="0" onClick={() => handleViewClick(event.event)}>
                                 <b><IconView16 /></b>
                                </div>
                            </td>
                            <td>
                            <div role="button" tabIndex="0" onClick={() => handleEditEvent(event)}>
                                    <IconEdit16 />
                                </div>
                            </td>
                            <td>
                                <div role="button" tabIndex="0" onClick={() => handleDeleteEvent(event.event)}>
                                    <IconDelete16 />
                                </div>
                            </td>
                            <td>
                                {/* <div role="button" tabIndex="0" onClick={() => handleAddTrainees(event.event)}>
                                    <IconAdd16 />
                                </div> */}
                            </td>
                        </tr>
                    ))}
                    
                </tbody>
            </table>
        ) : (
            <p>No events listed</p>
        )
    }
</div>

</div>
                    )}
                    <div style={{paddingLeft: '5px'}}>
                        {!showSection && !isViewClicked && !isEditing && <button  onClick={handleButtonClick}><IconAdd16/> New Course Dates</button>}
                    </div>
                    <div>
                        {showSection && dataProgramDE && (
                            <>
                            <table>
                                <thead>
                                
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
                                        {item.dataElement.displayName === 'Location' ? (
                                        <div>
                                            <OrganisationUnitTree
                                                initiallyExpanded={selected}
                                                //initiallyExpanded={"/" + defCourseOrgUnit}
                                                roots={defCourseOrgUnit} // replace with your root organisation unit ID
                                                selected={selected}
                                                onChange={onTreeChange}
                                                singleSelection
                                            />
                                        
                                        </div>
            ) : item.dataElement.valueType === 'DATE' ? (
                <DatePicker
                    selected={dateFields[item.dataElement.id] ? new Date(dateFields[item.dataElement.id]) : new Date()}
                    onChange={(date) => handleInputChangeCourseDate(item.dataElement.id, date)}
                    dateFormat="yyyy-MM-dd"
                    placeholderText='YYYY-MM-DD'
                />
            ) : item.dataElement.valueType === 'TEXT' ? (
                <input type="text" onChange={e => handleInputChangeCourse(item.dataElement.id, e.target.value)} />
            ) : (
                item.dataElement.valueType
            )}
                                        </td>
                                        </tr>
                                    );
                                    })}
                                </tbody>
                            </table>
                            <button onClick={() => setShowSection(false)}><IconCross16 />Cancel</button>
                            <button onClick={handleSave}><IconSave16 /> Save</button>
                            </>
                        )}
                    </div>
                    <div>
                        {showSectionEdit && dataProgramDE && (
                            <> 
                            {/* THIS IS THE EDIT SECTION */}
                            <table>
                                <thead>
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
                                        {item.dataElement.displayName === 'Location' ? (
                                            <div>
                                            {/* <input type="text" value={selectedEditEventDE[item.dataElement.id] + '-' + defCourseOrgUnit || ''} />\
                                            <input 
        type="text" 
        value={selected || selectedEditEventDE[item.dataElement.id] || ''} 
    /> */}
<p>{selectedLocationName}</p>

    <button onClick={() => setShowTree(!showTree)}>
                                            Change Location
                                        </button>
      {showTree &&                                       
                                            <OrganisationUnitTree
                                                initiallyExpanded={[defCourseOrgUnit]}
                                                //initiallyExpanded={"/" + defCourseOrgUnit}
                                                roots={defCourseOrgUnit} // replace with your root organisation unit ID
                                                selected={selected}
                                                onChange={onTreeChangeEdit}
                                                singleSelection
                                            />}
                                            
                                            </div>
            ) : item.dataElement.valueType === 'DATE' ? (
                <DatePicker
                    selected={formFieldsEdit[item.dataElement.id] ? new Date(formFieldsEdit[item.dataElement.id]) : null}
                    onChange={(date) => handleInputChangeCourseDateEdit(item.dataElement.id, date)}
                    dateFormat="yyyy-MM-dd"
                    placeholderText='YYYY-MM-DD'
                />
            ) : item.dataElement.valueType === 'TEXT' ? (
                <input 
                    type="text" 
                    value={formFieldsEdit[item.dataElement.id] }
                    onChange={e => handleInputChangeCourseEdit(item.dataElement.id, e.target.value)}  />
            ) : (
                item.dataElement.valueType
            )}
                                        </td>
                                        </tr>
                                    );
                                    })}
                                </tbody>
                            </table>
                            <button onClick={() => {
                                setShowSectionEdit(false);
                                setIsEditing(false);
                            }}><IconCross16 />Cancel</button>
                            <button onClick={handleSaveEdit}><IconSave16 /> Save</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
            </div>
  
  </div>
)
}


