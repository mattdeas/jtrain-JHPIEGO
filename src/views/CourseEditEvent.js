import React, { useEffect, useState } from 'react';

export const CourseEditEvent = ({ eventID }) => {
  const defCourseOrgUnitId = utilConfigConstantValueByName('DefaultCourseOrgUnit')
  const defCourseProgramId = utilConfigConstantValueByName('CourseProgram')
  const defCourseProgStageId = utilConfigConstantValueByName('CourseProgramStageId')

  const [showSection, setShowSection] = useState(false);

  const qryProgramDataElements = {
    "qPDE": {
        resource: 'programStages',
           "id": defCourseProgStageId,
           "params": {
               "fields": `programStageDataElements[program[id,${defCourseProgramId}],dataElement[id,displayName,valueType],sortOrder]`,
           },

    },
}

  const eventQuery = () => ({
    events: {
      resource: `events/${eventID}`,
    //   params: {
    //     fields: 'event,eventDate,dataValues[dataElement,value]',
    //   },
    },
  });


  const { loading: loadingEvent, error: errorEvent, data: dataEvent } = useDataQuery(eventQuery);
  const { loading: loading2, error2, data: dataProgramDE } = useDataQuery(qryProgramDataElements);

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
