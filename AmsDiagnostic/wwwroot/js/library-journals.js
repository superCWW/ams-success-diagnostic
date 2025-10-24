/**
 * Library Journals Management
 */

'use strict';

$(function () {
  console.log('Library Journals page loaded');

  // Initialize DataTable
  if ($('#journalsTable').length) {
    console.log('Initializing Journals DataTable...');

    $('#journalsTable').DataTable({
      order: [[0, 'asc']], // Sort by Title (first column) ascending
      pageLength: 10, // Show 10 records by default
      lengthMenu: [10, 20, 50, 100], // Options for page length
      searching: true, // Enable search
      dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
           '<"table-responsive"t>' +
           '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>', // Standard layout without buttons
      language: {
        search: 'Search:',
        lengthMenu: 'Show _MENU_ entries',
        info: 'Showing _START_ to _END_ of _TOTAL_ journals',
        infoEmpty: 'Showing 0 to 0 of 0 journals',
        infoFiltered: '(filtered from _TOTAL_ total journals)',
        paginate: {
          first: 'First',
          last: 'Last',
          next: 'Next',
          previous: 'Previous'
        }
      },
      columnDefs: [
        { targets: 0, orderable: true }, // Title column
        { targets: 1, orderable: true }  // Publisher column
      ],
      responsive: true
    });

    console.log('Journals DataTable initialized successfully');
  }
});
