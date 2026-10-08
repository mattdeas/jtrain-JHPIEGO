import { useDataQuery, useDataMutation, useDataEngine } from '@dhis2/app-runtime';
import { CourseDetailsCourseView } from './CourseDetailsCourseView';
import { CourseDateAttendees } from './CourseDateAttendees';
import { CourseDateStaffShow } from './CourseDate-StaffShow';
import { BrowserRouter as Router, Route, Link, Routes, useLocation , useParams} from 'react-router-dom';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import React, {useState, useEffect} from 'react'
import { utilConfigConstantValueByName } from '../utils/utils';
import { IconAdd16, IconDelete16, IconCross16, IconSave16, IconView16, IconEdit16 , IconArrowLeftMulti24, CircularLoader} from '@dhis2/ui';
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

// No-op debounced resize handler (placeholder)
const handleResize = debounce(() => {
}, 200);

window.addEventListener('resize', handleResize);

const today = new Date();
const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;




// All course date events for a course TEI
const eventsQuery = (id) => ({
    events: {
        resource: 'events',
        params: {
            trackedEntityInstance: id,
            fields: ['event', 'status', 'program', 'orgUnit', 'dataValues[dataElement,value]'],
        },
    },
});

// Update the course TEI's attributes
const mutation = {
    resource: 'trackedEntityInstances',
    id: ({ id }) => id,
    type: 'update',
    data: ({ orgUnit, attributes }) => ({
        orgUnit,
        attributes,
    }),
}


// Mutation builder: create a new course date event
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
  // All org units - used to show Location paths as names
  const ORG_UNITS_QUERY = {
    orgUnits: {
        resource: 'organisationUnits',
        params: {
            paging: false,
        },
    },
};

/**
 * Courseview (/courseview/:id)
 * A single course. Left: the course's attributes (read-only until "Edit Course Details"),
 * with Save / Cancel / Delete. Right: the course's dates (events) with view / edit / delete
 * per date, and a form to add new dates. Viewing a date shows its details and attendee list
 * (read-only - enrolment happens on the Training Capture page).
 */
export const Courseview = () => {
    const { id } = useParams();

    // Read config inside the component so it's picked up after App has loaded it into sessionStorage
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

    // Course program attributes (the course form fields), including option sets
    const qryProgramFields = {
        program: {
          resource: 'programs',
          id: ({ id }) => id,
          params: {
            fields: ['id', 'name', 'programTrackedEntityAttributes[sortOrder,trackedEntityAttribute[id,name,valueType,mandatory,optionSet[id,name,options[id,code,name,displayName]]]]'],
          },
        },
    };

    

    // Course stage data elements - the fields on each course date
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


    const { loading: loading2, error: error2, data: dataProgramDE } = useDataQuery(qryProgramDataElements);
  
  const engine = useDataEngine();
//Possibly hold off on this - functionality via jTRAIN.
  // Delete the whole course TEI after confirmation. Note: stays on this page afterwards.
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

  // Delete one course date event and refresh the list
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


// Unused placeholder (its button is commented out) - currently just a copy of handleDeleteEvent
const handleAddTrainees = (eventToDelete) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this event?");
    if (confirmDelete) {
        console.log('eventtodel',eventToDelete)
        deleteEvent(eventToDelete);
    }
};
  // Open the edit form for a course date, pre-filled with its values and Location name
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
    
    // New course date form: text field changed
    const handleInputChangeCourse = (name, value) => {
        console.log(name, value)

    // const { name, value } = event.target;
    setFormFieldsCourse(prevFields => ({
        ...prevFields,
        [name]: value,
    }));


    
}
const [selected, setSelected] = useState([]);

// Location picked in the tree (new date form / edit form): store the org unit path
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

// Date picked (new date form / edit form): store as YYYY-MM-DD
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

      // Create a new course date. Attendee list starts empty with a count of 0.
      // Note: the start/end date defaults below are applied after dataValues is built, so they only
      // affect the event date, not the saved start/end values.
      const handleSave = async () => {
        const dataValues = Object.entries(formFieldsCourse).map(([dataElement, value]) => ({ dataElement, value }));
        
        //Default values for Course Attendees and Counts
        const defCourseAttendeesId = utilConfigConstantValueByName('CourseAttendees')
        const defCourseAttendeesCountId = utilConfigConstantValueByName('CourseAttendeesCount')
        const defCourseStartDate = utilConfigConstantValueByName('CourseStartDate')
        const defCourseDEEndDate = utilConfigConstantValueByName('CourseEndDate');

        dataValues.push({ dataElement: defCourseAttendeesId, value: '' });
        dataValues.push({ dataElement: defCourseAttendeesCountId, value: '0' });

        // Check if defCourseDEStartDate and defCourseDEEndDate are present, if not, set them to today's date
        const today = new Date().toISOString().split('T')[0];

        if (!formFieldsCourse[defCourseStartDate]) {
            formFieldsCourse[defCourseStartDate] = today;
        }
        if (!formFieldsCourse[defCourseDEEndDate]) {
            formFieldsCourse[defCourseDEEndDate] = today;
        }

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

      // Save edits to a course date (the form was seeded with all the event's values, so attendee
      // fields are preserved). Note: resets the event date to today.
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
    
    // Stray JSX expression - has no effect (and handleAssign isn't defined here)
    <button onClick={() => handleAssign(trackedEntityInstance)}>
                                Assign
                            </button>
    
  const handleButtonClick = () => {
    setShowSection(true);
  };

  

    const [responseMessage, setResponseMessage] = useState('');
    const { loading: loadingEvents, error: errorEvents, data: eventsData, refetch: refetchEvent } = useDataQuery(eventsQuery(id));

    // Sort course dates newest first by end date.
    // Note: the next effect runs straight after and replaces this with the unsorted list.
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

    // Form fields as the [{ attribute, value }] list the API expects
    const attributes = Object.entries(formFields).map(([attribute, value]) => ({ attribute, value }));

    // Save the course attributes
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
                            setEditCourseShow(false);
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

    const handleStartEditCourse = () => {
        setResponseMessage('');
        setEditCourseShow(true);
    };

    // Discard edits: reset the form to the loaded values
    const handleCancelEditCourse = () => {
        const resetFields = trackedEntityInstance
            ? trackedEntityInstance.reduce((fields, attr) => ({
                ...fields,
                [attr.attribute]: attr.value,
            }), {})
            : {};

        setFormFields(resetFields);
        setResponseMessage('');
        setEditCourseShow(false);
    };

    
        const { loading: loading1, error: error1, data } = useDataQuery(qryProgramFields, {
        variables: {
          id:  defCourseProgramId, // Use the ID of the program you want to fetch
        },
    });

    
    const [events, setEvents] = useState([]);
    const isCourseLoading = loading1 || loadingEntity;
    const courseError = error1 || errorEntity;
    const isEventsLoading = loading2 || loadingEvents || orgUnitsLoading;
    const eventsError = error2 || errorEvents || orgUnitsError;

    // Load the course's attributes, then seed the form with them
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


    // Unused - and defLocationTEA isn't defined in this file, so it would throw if called
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

    // Current value for a course field: edited value first, else the loaded value
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

    // Show / hide the selected course date's details and attendees
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

    // Location/partner/date filters - state only, not applied to the list on this page
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

    // Edit course date form: text field changed
    const handleInputChangeCourseEdit = (dataElementId, value) => {
        setFormFieldsEdit(prevFields => ({
            ...prevFields,
            [dataElementId]: value,
        }));
    };
    


    return (
        <div key={key}  style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex' }}>
                <div style={{ flex: '0 0 25%', minHeight: '90vh' }}>
  
    <h1>Course Details</h1>

        {isCourseLoading && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <CircularLoader small />
                <span>Loading...</span>
            </div>
        )}

        {courseError && <div>{courseError.message || 'An error occurred while loading course details.'}</div>}


    {/* Course attributes form - inputs are disabled until Edit Course Details is clicked */}
    {!isCourseLoading && !courseError && data?.program?.programTrackedEntityAttributes && (
            
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
                                        disabled={!editCourseShow}
                                        value={findAttributeValue(trackedEntityAttribute.id)}>
                                            {trackedEntityAttribute.optionSet.options.map(option => (
                                                <option key={option.id} value={option.code}>
                                                    {option.name}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input type="text" name={trackedEntityAttribute.id} value={findAttributeValue(trackedEntityAttribute.id)} onChange={handleInputChange} disabled={!editCourseShow} />
                                    )
                                ) : trackedEntityAttribute.valueType === 'DATE' ? (
                                    <input type="date" name={trackedEntityAttribute.id} value={findAttributeValue(trackedEntityAttribute.id)}  onChange={handleInputChange} disabled={!editCourseShow}/>
                                ) : trackedEntityAttribute.valueType === 'NUMBER' ? (
                                    <input type="number" name={trackedEntityAttribute.id} value={findAttributeValue(trackedEntityAttribute.id)} onChange={handleInputChange} disabled={!editCourseShow}/>
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
                        <button type="button" onClick={handleStartEditCourse}><IconEdit16 /> Edit Course Details</button>
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
                        <button type="button" onClick={handleCancelEditCourse}><IconCross16/> Cancel</button>
                        <button type="button" onClick={handleDelete}><IconDelete16 /> Delete</button>
                    </div>
                )}
                
            </div>
            
            <p>{responseMessage}</p>
            
            
   
        </form>

        
    )}

    {!isCourseLoading && !courseError && !data?.program?.programTrackedEntityAttributes && (
        <div>No course data available.</div>
    )}
{/* Selected course date: details + read-only attendee list (dElements={null} hides the enrol panel) */}
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
                    
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    
    {isEventsLoading && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <CircularLoader small />
            <span>Loading events...</span>
        </div>
    )}

    {eventsError && <div>{eventsError.message || 'An error occurred while loading course events.'}</div>}

    {/* One row per course date: summary, then view / edit / delete */}
    {!isEventsLoading && !eventsError && (
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
    )}
</div>

</div>
                    )}
                    <div style={{paddingLeft: '5px'}}>
                        {!showSection && !isViewClicked && !isEditing && <button  onClick={handleButtonClick}><IconAdd16/> New Course Dates</button>}
                    </div>
                    <div>
                        {/* New course date form (jtrain_* fields are managed by the app and hidden) */}
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


