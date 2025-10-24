/**
 * Library Journal Electronic Routing Management
 */

'use strict';

$(function () {
  console.log('Library Journal Electronic Routing page loaded');

  let electronicRoutingTable;
  const electronicRoutingModal = $('#electronicRoutingModal');
  const electronicRoutingForm = $('#electronicRoutingForm');
  const journalId = $('#electronicRoutingJournalId').val();

  // Get CSRF token
  function getAntiForgeryToken() {
    return $('input[name="__RequestVerificationToken"]').val();
  }

  // Initialize DataTable
  if ($('#electronicRoutingTable').length) {
    console.log('Initializing Electronic Routing DataTable...');

    electronicRoutingTable = $('#electronicRoutingTable').DataTable({
      ajax: {
        url: `/LibraryAdmin/Journal?handler=ElectronicRoutingEntries&journalId=${journalId}`,
        type: 'GET',
        dataSrc: function (json) {
          console.log('DataTable response:', json);
          if (json.success) {
            console.log('Loaded ' + json.data.length + ' electronic routing entries');
            return json.data;
          } else {
            console.error('Error loading electronic routing entries:', json.message);
            Swal.fire('Error', json.message || 'Error loading electronic routing entries', 'error');
            return [];
          }
        },
        error: function (xhr, error, code) {
          console.error('AJAX Error loading electronic routing entries:', error, xhr);
          Swal.fire('Error', 'Failed to load electronic routing entries', 'error');
        }
      },
      columns: [
        { data: 'name' },
        { data: 'email' },
        {
          data: null,
          orderable: false,
          width: '150px',
          render: function (data, type, row) {
            return `
              <div style="white-space: nowrap;">
                <a href="javascript:void(0);" class="text-primary me-2 link-edit-electronic-routing" data-id="${row.electronicRoutingID}" title="Edit">
                  <i class="ti tabler-edit"></i> Edit
                </a>
                <a href="javascript:void(0);" class="text-danger link-delete-electronic-routing" data-id="${row.electronicRoutingID}" title="Delete">
                  <i class="ti tabler-trash"></i> Delete
                </a>
              </div>
            `;
          }
        }
      ],
      order: [[0, 'asc']], // Sort by Name ascending
      pageLength: 20,
      lengthMenu: [20, 50, 100],
      searching: true,
      dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
           '<"table-responsive"t>' +
           '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
      language: {
        search: 'Search:',
        lengthMenu: 'Show _MENU_ entries',
        info: 'Showing _START_ to _END_ of _TOTAL_ recipients',
        infoEmpty: 'Showing 0 to 0 of 0 recipients',
        infoFiltered: '(filtered from _TOTAL_ total recipients)',
        paginate: {
          first: 'First',
          last: 'Last',
          next: 'Next',
          previous: 'Previous'
        }
      },
      responsive: true
    });

    console.log('Electronic Routing DataTable initialized successfully');
  }

  // Add Recipient button click
  $('#btnAddElectronicRouting').on('click', function () {
    console.log('Add Recipient button clicked');
    electronicRoutingForm[0].reset();
    $('#electronicRoutingId').val('0');
    $('#electronicRoutingJournalIdField').val(journalId);
    $('#electronicRoutingModalTitle').text('Add Electronic Routing Recipient');
    electronicRoutingModal.modal('show');
  });

  // Edit link click (delegated event)
  $('#electronicRoutingTable').on('click', '.link-edit-electronic-routing', function () {
    const electronicRoutingId = $(this).data('id');
    console.log('Edit link clicked for electronic routing:', electronicRoutingId);

    // Fetch electronic routing data
    $.ajax({
      url: `/LibraryAdmin/Journal?handler=ElectronicRoutingEntry&electronicRoutingId=${electronicRoutingId}`,
      type: 'GET',
      success: function (response) {
        if (response.success && response.data) {
          const entry = response.data;
          console.log('Electronic routing data loaded:', entry);

          $('#electronicRoutingId').val(entry.electronicRoutingID);
          $('#electronicRoutingJournalIdField').val(entry.journalID);
          $('#electronicRoutingName').val(entry.name);
          $('#electronicRoutingEmail').val(entry.email);

          $('#electronicRoutingModalTitle').text('Edit Electronic Routing Recipient');
          electronicRoutingModal.modal('show');
        } else {
          Swal.fire('Error', response.message || 'Failed to load electronic routing entry', 'error');
        }
      },
      error: function (xhr, error, code) {
        console.error('Error loading electronic routing entry:', error, xhr);
        Swal.fire('Error', 'Failed to load electronic routing entry data', 'error');
      }
    });
  });

  // Delete link click (delegated event)
  $('#electronicRoutingTable').on('click', '.link-delete-electronic-routing', function () {
    const electronicRoutingId = $(this).data('id');
    console.log('Delete link clicked for electronic routing:', electronicRoutingId);

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
          url: '/LibraryAdmin/Journal?handler=DeleteElectronicRouting',
          type: 'POST',
          contentType: 'application/json',
          headers: {
            'RequestVerificationToken': getAntiForgeryToken()
          },
          data: JSON.stringify(electronicRoutingId),
          success: function (response) {
            if (response.success) {
              Swal.fire('Deleted!', 'Electronic routing entry has been deleted.', 'success');
              electronicRoutingTable.ajax.reload();
            } else {
              Swal.fire('Error', response.message || 'Failed to delete electronic routing entry', 'error');
            }
          },
          error: function (xhr, error, code) {
            console.error('Error deleting electronic routing entry:', error, xhr);
            Swal.fire('Error', 'Failed to delete electronic routing entry', 'error');
          }
        });
      }
    });
  });

  // Save button click
  $('#btnSaveElectronicRouting').on('click', function () {
    console.log('Save Electronic Routing button clicked');

    // Validate
    if (!$('#electronicRoutingName').val().trim()) {
      Swal.fire('Validation Error', 'Name is required', 'warning');
      return;
    }

    if (!$('#electronicRoutingEmail').val().trim()) {
      Swal.fire('Validation Error', 'Email is required', 'warning');
      return;
    }

    // Basic email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test($('#electronicRoutingEmail').val())) {
      Swal.fire('Validation Error', 'Please enter a valid email address', 'warning');
      return;
    }

    const electronicRoutingData = {
      electronicRoutingID: parseInt($('#electronicRoutingId').val()) || 0,
      journalID: parseInt($('#electronicRoutingJournalIdField').val()),
      name: $('#electronicRoutingName').val(),
      email: $('#electronicRoutingEmail').val()
    };

    console.log('Saving electronic routing data:', electronicRoutingData);

    $.ajax({
      url: '/LibraryAdmin/Journal?handler=SaveElectronicRouting',
      type: 'POST',
      contentType: 'application/json',
      headers: {
        'RequestVerificationToken': getAntiForgeryToken()
      },
      data: JSON.stringify(electronicRoutingData),
      success: function (response) {
        if (response.success) {
          Swal.fire('Success', response.message || 'Electronic routing entry saved successfully', 'success');
          electronicRoutingModal.modal('hide');
          electronicRoutingTable.ajax.reload();
        } else {
          Swal.fire('Error', response.message || 'Failed to save electronic routing entry', 'error');
        }
      },
      error: function (xhr, error, code) {
        console.error('Error saving electronic routing entry:', error, xhr);
        Swal.fire('Error', 'Failed to save electronic routing entry', 'error');
      }
    });
  });

  // Load electronic routing entries when Electronic Routing tab is shown
  $('button[data-bs-target="#electronicRouting"]').on('shown.bs.tab', function () {
    console.log('Electronic Routing tab shown, loading entries');
    if (electronicRoutingTable) {
      electronicRoutingTable.ajax.reload();
    }
  });
});
