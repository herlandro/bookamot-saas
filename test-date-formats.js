// Test script to identify date format inconsistencies

const testDate = new Date('2025-09-15T10:30:00.000Z');
const testDateString = '2025-09-15';

console.log('=== Date Format Consistency Test ===\n');

// Simulate the different formatDate functions found in the codebase

// 1. Utils formatDate (main utility)
function utilsFormatDate(date, format = 'short') {
  const options = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' }
  };
  
  return new Intl.DateTimeFormat('en-GB', options[format]).format(date);
}

// 2. GarageCalendar formatDate (ISO format)
function garageCalendarFormatDate(date) {
  return date.toISOString().split('T')[0];
}

// 3. BookingModal formatDate (Portuguese locale)
function bookingModalFormatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// 4. Search results formatDate (custom format)
function searchResultsFormatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// 5. Backend API format (toISOString)
function backendFormatDate(date) {
  return date.toISOString();
}

// 6. Backend API date-only format (split)
function backendDateOnlyFormat(date) {
  return date.toISOString().split('T')[0];
}

console.log('Test Date:', testDate);
console.log('Test Date String:', testDateString);
console.log();

console.log('=== Frontend Formats ===');
console.log('1. Utils formatDate (short):', utilsFormatDate(testDate, 'short'));
console.log('2. Utils formatDate (long):', utilsFormatDate(testDate, 'long'));
console.log('3. GarageCalendar formatDate:', garageCalendarFormatDate(testDate));
console.log('4. BookingModal formatDate:', bookingModalFormatDate(testDateString));
console.log('5. SearchResults formatDate:', searchResultsFormatDate(testDateString));
console.log();

console.log('=== Backend Formats ===');
console.log('6. Backend toISOString():', backendFormatDate(testDate));
console.log('7. Backend date-only:', backendDateOnlyFormat(testDate));
console.log();

console.log('=== Issues Identified ===');
console.log('❌ Multiple formatDate functions with different behaviors');
console.log('❌ GarageCalendar uses ISO format instead of utils formatDate');
console.log('❌ BookingModal uses Portuguese locale instead of English');
console.log('❌ SearchResults duplicates utils formatDate logic');
console.log('❌ Backend and frontend date formats may not align');
console.log();

console.log('=== Recommendations ===');
console.log('✅ Standardize on utils formatDate for all frontend components');
console.log('✅ Use consistent locale (en-GB) across all components');
console.log('✅ Backend should use ISO format for API responses');
console.log('✅ Frontend should parse ISO dates and format using utils');
console.log('✅ Remove duplicate formatDate functions');