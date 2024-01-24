import React from 'react';
import { StaffSearch } from './StaffSearch'
import { StaffSearchAttendees } from './StaffSearchAttendees';

export const CourseDateAttendees = ({ eventID }) => {
    // You can use the eventId prop here

    return (
        <div>
            <h3>Course Date Attendees</h3>
            <p>Event ID: {eventID}</p>

            <StaffSearchAttendees eventID={eventID}/>
        </div>
    );
};

