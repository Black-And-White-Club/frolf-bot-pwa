/**
 * Calendar utilities for round management
 * Extracted for reusability across components
 */

import type { Round } from '$lib/types/backend';

interface CalendarEvent {
	name: string;
	description: string;
	location: string;
	startDate: string;
	endDate: string;
	startTime: string;
	endTime: string;
	timeZone: string;
}

export function createCalendarEvent(round: Round): CalendarEvent {
	const startDate = round.start_time ? new Date(round.start_time) : new Date(round.created_at);
	const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

	return {
		name: `Disc Golf Round: ${round.title}`,
		description: round.description || `Round at ${round.location || 'TBD'}`,
		location: round.location || 'TBD',
		startDate: startDate.toISOString().split('T')[0],
		endDate: endDate.toISOString().split('T')[0],
		startTime: startDate.toTimeString().split(' ')[0].substring(0, 5),
		endTime: endDate.toTimeString().split(' ')[0].substring(0, 5),
		timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
	};
}

export function addToCalendar(round: Round) {
	const event = createCalendarEvent(round);

	// Try native calendar APIs first (mobile)
	if ('navigator' in window && 'share' in navigator) {
		const calendarUrl = generateCalendarUrl(event);
		navigator
			.share({
				title: event.name,
				text: event.description,
				url: calendarUrl
			})
			.catch(() => {
				downloadICalendarFile(event, round.round_id);
			});
	} else {
		downloadICalendarFile(event, round.round_id);
	}
}

function generateCalendarUrl(event: CalendarEvent): string {
	const start =
		new Date(event.startDate + 'T' + event.startTime)
			.toISOString()
			.replace(/[-:]/g, '')
			.split('.')[0] + 'Z';
	const end =
		new Date(event.endDate + 'T' + event.endTime).toISOString().replace(/[-:]/g, '').split('.')[0] +
		'Z';

	return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${start}/${end}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
}

function downloadICalendarFile(event: CalendarEvent, roundId: string) {
	const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${event.name}
DESCRIPTION:${event.description}
LOCATION:${event.location}
DTSTART:${new Date(event.startDate + 'T' + event.startTime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${new Date(event.endDate + 'T' + event.endTime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
END:VEVENT
END:VCALENDAR`;

	const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
	const link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = `round-${roundId}.ics`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}
