import React, { useEffect } from 'react';
import { useDataMutation } from '@dhis2/app-runtime';
import { CalendarInput } from '@dhis2/ui'

const UploadDataToDHIS2 = () => {
  const jsonToUpload = {
    "trackedEntityInstances": [{
      "orgUnit": "VgrqnQEtyOP",
      "trackedEntityInstance": "1",
      "trackedEntityType": "W9FNXXgGbm7",
      "attributes": [{
        "attribute": "jv1fu2pDYKE",
        "value": "01"
      }, {
        "attribute": "zh91RcBXyEf",
        "value": "2004-01-01"
      }, {
        "attribute": "esA6f27JSQM",
        "value": "55"
      }, {
        "attribute": "ggdR2bH42l3",
        "value": "1"
      }, {
        "attribute": "Zb9icCay6Ka",
        "value": "0"
      }]
    }]
  };

  const mutation = {
    resource: 'trackedEntityInstances',
    type: 'create',
    data: jsonToUpload,
  };

  const [mutate, { loading, error, data }] = useDataMutation(mutation);

  useEffect(() => {
    const uploadData = async () => {
      try {
        await mutate();
        console.log('Data uploaded successfully');
        // Additional logic after successful upload
      } catch (err) {
        console.error('Error uploading data:', err);
        // Handle error
      }
    };

    // Call the uploadData method when the component mounts
    uploadData();
  }, [mutate]);

  return (
    <div>
      
      <CalendarInput date="2021-10-13"     dir="ltr"
    locale="en-CA"
    timeZone="Africa/Khartoum"
    weekDayFormat="short" />
    </div>
  );
};

export default UploadDataToDHIS2;