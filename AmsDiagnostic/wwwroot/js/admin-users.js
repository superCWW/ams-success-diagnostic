/**
 * Admin Users Management
 */

'use strict';

$(function () {
  console.log('Admin Users page loaded');

  let usersTable;
  const userModal = $('#userModal');
  const userForm = $('#userForm');

  // Initialize DataTable
  if ($('#usersTable').length) {
    console.log('Initializing DataTable...');
    usersTable = $('#usersTable').DataTable({
      ajax: {
        url: '/Admin/Users?handler=Users',
        type: 'GET',
        dataSrc: function (json) {
          console.log('DataTable response:', json);
          if (json.success) {
            console.log('Loaded ' + json.data.length + ' users');
            return json.data;
          } else {
            console.error('Error loading users:', json.message);
            return [];
          }
        },
        error: function (xhr, error, code) {
          console.error('AJAX Error loading users:', error, xhr);
        }
      },
      columns: [
        { data: 'userid' },
        {
          data: 'imisid',
          render: function (data, type, row) {
            return data || '<span class="text-muted">N/A</span>';
          }
        },
        { data: 'windowsusername' },
        {
          data: 'is_active',
          render: function (data, type, row) {
            const statusClass = data ? 'bg-label-success' : 'bg-label-secondary';
            const statusText = data ? 'Active' : 'Inactive';
            return `<span class="badge ${statusClass}">${statusText}</span>`;
          }
        },
        {
          data: null,
          orderable: false,
          searchable: false,
          render: function (data, type, row) {
            return `
              <div class="d-flex align-items-center gap-2">
                <button class="btn btn-sm btn-icon btn-text-secondary rounded-pill waves-effect waves-light edit-user"
                        data-id="${row.userid}"
                        data-imisid="${row.imisid || ''}"
                        data-username="${row.windowsusername}"
                        data-active="${row.is_active}"
                        title="Edit">
                  <i class="ti tabler-edit"></i>
                </button>
                <button class="btn btn-sm btn-icon btn-text-danger rounded-pill waves-effect waves-light delete-user"
                        data-id="${row.userid}"
                        data-username="${row.windowsusername}"
                        title="Delete">
                  <i class="ti tabler-trash"></i>
                </button>
              </div>
            `;
          }
        }
      ],
      order: [[2, 'asc']], // Sort by username by default
      pageLength: 50, // Show 50 records per page
      dom:
        '<"row"' +
        '<"col-md-2"<"ms-n2"l>>' +
        '<"col-md-10"<"dt-action-buttons text-xl-end text-lg-start text-md-end text-start d-flex align-items-center justify-content-end flex-md-row flex-column mb-6 mb-md-0 mt-n6 mt-md-0"f>>' +
        '>t' +
        '<"row"' +
        '<"col-sm-12 col-md-6"i>' +
        '<"col-sm-12 col-md-6"p>' +
        '>',
      language: {
        search: '',
        searchPlaceholder: 'Search Users...',
        lengthMenu: '_MENU_',
        info: 'Showing _START_ to _END_ of _TOTAL_ entries',
        paginate: {
          next: '<i class="ti tabler-chevron-right ti-sm"></i>',
          previous: '<i class="ti tabler-chevron-left ti-sm"></i>'
        }
      },
      responsive: {
        details: {
          display: $.fn.dataTable.Responsive.display.modal({
            header: function (row) {
              var data = row.data();
              return 'Details of ' + data.windowsusername;
            }
          }),
          type: 'column',
          renderer: $.fn.dataTable.Responsive.renderer.tableAll({
            tableClass: 'table'
          })
        }
      }
    });
  }

  // Add User button click
  $('#btnAddUser').on('click', function () {
    $('#userModalTitle').text('Add User');
    userForm[0].reset();
    $('#userId').val('');
    $('#isActive').val('true');
  });

  // Edit User button click
  $(document).on('click', '.edit-user', function () {
    const userId = $(this).data('id');
    const imisId = $(this).data('imisid');
    const username = $(this).data('username');
    const isActive = $(this).data('active');

    $('#userModalTitle').text('Edit User');
    $('#userId').val(userId);
    $('#imisId').val(imisId);
    $('#windowsUsername').val(username);
    $('#isActive').val(isActive.toString());

    userModal.modal('show');
  });

  // Save User button click
  $('#btnSaveUser').on('click', function () {
    console.log('Save button clicked');

    // Validate form
    if (!userForm[0].checkValidity()) {
      userForm[0].reportValidity();
      return;
    }

    const userId = $('#userId').val();
    const userData = {
      userId: userId ? parseInt(userId) : null,
      imisId: $('#imisId').val() || null,
      windowsUsername: $('#windowsUsername').val(),
      isActive: $('#isActive').val() === 'true'
    };

    console.log('Saving user data:', userData);

    // Disable button during save
    $('#btnSaveUser').prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Saving...');

    $.ajax({
      url: '/Admin/Users?handler=SaveUser',
      type: 'POST',
      contentType: 'application/json',
      headers: {
        RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val()
      },
      data: JSON.stringify(userData),
      success: function (response) {
        console.log('Save response:', response);
        if (response.success) {
          userModal.modal('hide');
          usersTable.ajax.reload();

          // Show success message
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: response.message,
            customClass: {
              confirmButton: 'btn btn-success'
            }
          });
        } else {
          console.error('Save failed:', response.message);
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: response.message,
            customClass: {
              confirmButton: 'btn btn-primary'
            }
          });
        }
      },
      error: function (xhr, status, error) {
        console.error('AJAX error saving user:', status, error, xhr);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'An error occurred while saving the user: ' + error,
          customClass: {
            confirmButton: 'btn btn-primary'
          }
        });
      },
      complete: function () {
        $('#btnSaveUser').prop('disabled', false).html('Save');
      }
    });
  });

  // Delete User button click
  $(document).on('click', '.delete-user', function () {
    const userId = $(this).data('id');
    const username = $(this).data('username');

    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete user "${username}"? This will set the user as inactive.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'btn btn-danger me-3',
        cancelButton: 'btn btn-label-secondary'
      },
      buttonsStyling: false
    }).then(function (result) {
      if (result.value) {
        console.log('Deleting user:', userId);
        $.ajax({
          url: '/Admin/Users?handler=DeleteUser',
          type: 'POST',
          headers: {
            RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val()
          },
          data: {
            userId: userId,
            hardDelete: false
          },
          success: function (response) {
            if (response.success) {
              usersTable.ajax.reload();
              Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: response.message,
                customClass: {
                  confirmButton: 'btn btn-success'
                }
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: response.message,
                customClass: {
                  confirmButton: 'btn btn-primary'
                }
              });
            }
          },
          error: function (xhr, status, error) {
            console.error('AJAX error deleting user:', status, error, xhr);
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: 'An error occurred while deleting the user: ' + error,
              customClass: {
                confirmButton: 'btn btn-primary'
              }
            });
          }
        });
      }
    });
  });
});
