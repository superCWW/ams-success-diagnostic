/**
 * Library Journal Issues Management
 */

'use strict';

$(function () {
  console.log('Library Journal Issues page loaded');

  let issuesTable;
  const issueModal = $('#issueModal');
  const issueForm = $('#issueForm');
  const journalId = $('#journalId').val();

  // Get CSRF token
  function getAntiForgeryToken() {
    return $('input[name="__RequestVerificationToken"]').val();
  }

  // Initialize DataTable
  if ($('#issuesTable').length) {
    console.log('Initializing Issues DataTable...');

    issuesTable = $('#issuesTable').DataTable({
      ajax: {
        url: `/LibraryAdmin/Journal?handler=Issues&journalId=${journalId}`,
        type: 'GET',
        dataSrc: function (json) {
          console.log('DataTable response:', json);
          if (json.success) {
            console.log('Loaded ' + json.data.length + ' issues');
            return json.data;
          } else {
            console.error('Error loading issues:', json.message);
            Swal.fire('Error', json.message || 'Error loading issues', 'error');
            return [];
          }
        },
        error: function (xhr, error, code) {
          console.error('AJAX Error loading issues:', error, xhr);
          Swal.fire('Error', 'Failed to load issues', 'error');
        }
      },
      columns: [
        { data: 'journalTitle' },
        { data: 'volume' },
        {
          data: 'issueDueDate',
          render: function (data, type, row) {
            if (!data) return '<span class="text-muted">N/A</span>';
            const date = new Date(data);
            return date.toLocaleDateString();
          }
        },
        {
          data: 'checkedIn',
          render: function (data, type, row) {
            const statusClass = data ? 'bg-label-success' : 'bg-label-secondary';
            const statusText = data ? 'Yes' : 'No';
            return `<span class="badge ${statusClass}">${statusText}</span>`;
          }
        },
        {
          data: null,
          orderable: false,
          width: '280px',
          render: function (data, type, row) {
            const checkInLink = !row.checkedIn ?
              `<a href="javascript:void(0);" class="text-success me-2 link-check-in" data-id="${row.issueID}" title="Check In">
                <i class="ti tabler-check"></i> Check-In
              </a>` : '';

            return `
              <div style="white-space: nowrap;">
                ${checkInLink}
                <a href="javascript:void(0);" class="text-primary me-2 link-edit" data-id="${row.issueID}" title="Edit">
                  <i class="ti tabler-edit"></i> Edit
                </a>
                <a href="javascript:void(0);" class="text-info me-2 link-print-routing" data-id="${row.issueID}" title="Print Routing">
                  <i class="ti tabler-printer"></i> Print Routing
                </a>
                <a href="javascript:void(0);" class="text-danger link-delete" data-id="${row.issueID}" title="Delete">
                  <i class="ti tabler-trash"></i> Delete
                </a>
              </div>
            `;
          }
        }
      ],
      order: [[2, 'desc']], // Sort by Issue Due Date descending
      pageLength: 20,
      lengthMenu: [20, 50, 100],
      searching: true,
      dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
           '<"table-responsive"t>' +
           '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
      language: {
        search: 'Search:',
        lengthMenu: 'Show _MENU_ entries',
        info: 'Showing _START_ to _END_ of _TOTAL_ issues',
        infoEmpty: 'Showing 0 to 0 of 0 issues',
        infoFiltered: '(filtered from _TOTAL_ total issues)',
        paginate: {
          first: 'First',
          last: 'Last',
          next: 'Next',
          previous: 'Previous'
        }
      },
      responsive: true
    });

    console.log('Issues DataTable initialized successfully');
  }

  // Add Issue button click
  $('#btnAddIssue').on('click', function () {
    console.log('Add Issue button clicked');
    issueForm[0].reset();
    $('#issueId').val('0');
    $('#issueJournalId').val(journalId);
    $('#journalTitleField').val($('#journalTitle').val());
    $('#issueModalTitle').text('Add Issue');
    issueModal.modal('show');
  });

  // Edit link click (delegated event)
  $('#issuesTable').on('click', '.link-edit', function () {
    const issueId = $(this).data('id');
    console.log('Edit button clicked for issue:', issueId);

    // Fetch issue data
    $.ajax({
      url: `/LibraryAdmin/Journal?handler=Issue&issueId=${issueId}`,
      type: 'GET',
      success: function (response) {
        if (response.success && response.data) {
          const issue = response.data;
          console.log('Issue data loaded:', issue);

          $('#issueId').val(issue.issueID);
          $('#issueJournalId').val(issue.journalID);
          $('#journalTitleField').val(issue.journalTitle);
          $('#volume').val(issue.volume);
          $('#issueDescription').val(issue.issueDescription);
          $('#checkedIn').prop('checked', issue.checkedIn);

          if (issue.issueDueDate) {
            const date = new Date(issue.issueDueDate);
            $('#issueDueDate').val(date.toISOString().split('T')[0]);
          } else {
            $('#issueDueDate').val('');
          }

          $('#issueModalTitle').text('Edit Issue');
          issueModal.modal('show');
        } else {
          Swal.fire('Error', response.message || 'Failed to load issue', 'error');
        }
      },
      error: function (xhr, error, code) {
        console.error('Error loading issue:', error, xhr);
        Swal.fire('Error', 'Failed to load issue data', 'error');
      }
    });
  });

  // Check In link click (delegated event)
  $('#issuesTable').on('click', '.link-check-in', function () {
    const issueId = $(this).data('id');
    console.log('Check In button clicked for issue:', issueId);

    Swal.fire({
      title: 'Check In Issue?',
      text: 'This will mark the issue as checked in.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, check in',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        $.ajax({
          url: '/LibraryAdmin/Journal?handler=CheckIn',
          type: 'POST',
          contentType: 'application/json',
          headers: {
            'RequestVerificationToken': getAntiForgeryToken()
          },
          data: JSON.stringify(issueId),
          success: function (response) {
            if (response.success) {
              Swal.fire('Success', 'Issue checked in successfully', 'success');
              issuesTable.ajax.reload();
            } else {
              Swal.fire('Error', response.message || 'Failed to check in issue', 'error');
            }
          },
          error: function (xhr, error, code) {
            console.error('Error checking in issue:', error, xhr);
            Swal.fire('Error', 'Failed to check in issue', 'error');
          }
        });
      }
    });
  });

  // Delete link click (delegated event)
  $('#issuesTable').on('click', '.link-delete', function () {
    const issueId = $(this).data('id');
    console.log('Delete button clicked for issue:', issueId);

    Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        $.ajax({
          url: '/LibraryAdmin/Journal?handler=DeleteIssue',
          type: 'POST',
          contentType: 'application/json',
          headers: {
            'RequestVerificationToken': getAntiForgeryToken()
          },
          data: JSON.stringify(issueId),
          success: function (response) {
            if (response.success) {
              Swal.fire('Deleted!', 'Issue has been deleted.', 'success');
              issuesTable.ajax.reload();
            } else {
              Swal.fire('Error', response.message || 'Failed to delete issue', 'error');
            }
          },
          error: function (xhr, error, code) {
            console.error('Error deleting issue:', error, xhr);
            Swal.fire('Error', 'Failed to delete issue', 'error');
          }
        });
      }
    });
  });

  // Save Issue button click
  $('#btnSaveIssue').on('click', function () {
    console.log('Save Issue button clicked');

    const issueData = {
      issueID: parseInt($('#issueId').val()) || 0,
      journalID: parseInt($('#issueJournalId').val()),
      journalTitle: $('#journalTitleField').val(),
      volume: $('#volume').val(),
      issueDescription: $('#issueDescription').val(),
      issueDueDate: $('#issueDueDate').val() || null,
      checkedIn: $('#checkedIn').is(':checked')
    };

    console.log('Saving issue data:', issueData);

    $.ajax({
      url: '/LibraryAdmin/Journal?handler=SaveIssue',
      type: 'POST',
      contentType: 'application/json',
      headers: {
        'RequestVerificationToken': getAntiForgeryToken()
      },
      data: JSON.stringify(issueData),
      success: function (response) {
        if (response.success) {
          Swal.fire('Success', response.message || 'Issue saved successfully', 'success');
          issueModal.modal('hide');
          issuesTable.ajax.reload();
        } else {
          Swal.fire('Error', response.message || 'Failed to save issue', 'error');
        }
      },
      error: function (xhr, error, code) {
        console.error('Error saving issue:', error, xhr);
        Swal.fire('Error', 'Failed to save issue', 'error');
      }
    });
  });

  // Print Routing link click (delegated event)
  $('#issuesTable').on('click', '.link-print-routing', function () {
    const issueId = $(this).data('id');
    console.log('Print Routing link clicked for issue:', issueId);

    // Open print routing in a new window/tab
    window.open(`/LibraryAdmin/PrintRouting?issueId=${issueId}`, '_blank');
  });
});
