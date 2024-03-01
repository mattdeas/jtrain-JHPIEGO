import React, { useEffect, useState } from 'react';

const CourseEditEvent = ({ eventID }) => {
  const [showSection, setShowSection] = useState(false);
  const [dataProgramDE, setDataProgramDE] = useState(null);


  const eventQuery = () => ({
    events: {
      resource: `events/${eventID}`,
    //   params: {
    //     fields: 'event,eventDate,dataValues[dataElement,value]',
    //   },
    },
  });

  const { loading: loadingEvent, error: errorEvent, data: dataEvent } = useDataQuery(eventQuery);
  
  useEffect(() => {
    // Fetch the event information using eventID
    // Update the state variables showSection and dataProgramDE based on the fetched data
  }, [eventID]);

  const handleInputChangeCourse = (id, value) => {
    // Handle input change
  };

  const handleSave = () => {
    // Handle save
  };

  return (
    <div>
      {showSection && dataProgramDE && (
        <>
          <table>
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
  );
};

export default CourseEditEvent;