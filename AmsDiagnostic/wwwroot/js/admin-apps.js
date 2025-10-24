/**
 * Admin Apps Management
 */

'use strict';

$(function () {
  console.log('Admin Apps page loaded');

  let appsTable;
  const appModal = $('#appModal');
  const appForm = $('#appForm');

  // Initialize DataTable
  if ($('#appsTable').length) {
    console.log('Initializing DataTable...');
    appsTable = $('#appsTable').DataTable({
      ajax: {
        url: '/Admin/Apps?handler=Apps',
        type: 'GET',
        dataSrc: function (json) {
          console.log('DataTable response:', json);
          if (json.success) {
            console.log('Loaded ' + json.data.length + ' apps');
            return json.data;
          } else {
            console.error('Error loading apps:', json.message);
            return [];
          }
        },
        error: function (xhr, error, code) {
          console.error('AJAX Error loading apps:', error, xhr);
        }
      },
      columns: [
        { data: 'appid' },
        { data: 'appname' },
        {
          data: 'description',
          render: function (data, type, row) {
            return data || '<span class="text-muted">N/A</span>';
          }
        },
        {
          data: 'category',
          render: function (data, type, row) {
            return data || '<span class="text-muted">N/A</span>';
          }
        },
        {
          data: 'icon',
          render: function (data, type, row) {
            const iconClass = data || 'tabler-app-window';
            return `<i class="ti ${iconClass}"></i> ${iconClass}`;
          }
        },
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
                <button class="btn btn-sm btn-icon btn-text-secondary rounded-pill waves-effect waves-light edit-app"
                        data-id="${row.appid}"
                        data-name="${row.appname}"
                        data-description="${row.description || ''}"
                        data-category="${row.category || ''}"
                        data-icon="${row.icon || 'tabler-app-window'}"
                        data-active="${row.is_active}"
                        title="Edit">
                  <i class="ti tabler-edit"></i>
                </button>
                <button class="btn btn-sm btn-icon btn-text-danger rounded-pill waves-effect waves-light delete-app"
                        data-id="${row.appid}"
                        data-name="${row.appname}"
                        title="Delete">
                  <i class="ti tabler-trash"></i>
                </button>
              </div>
            `;
          }
        }
      ],
      order: [[1, 'asc']], // Sort by app name by default
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
        searchPlaceholder: 'Search Apps...',
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
              return 'Details of ' + data.appname;
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

  // Add App button click
  $('#btnAddApp').on('click', function () {
    $('#appModalTitle').text('Add App');
    appForm[0].reset();
    $('#appId').val('');
    $('#isActive').val('true');
  });

  // Edit App button click
  $(document).on('click', '.edit-app', function () {
    const appId = $(this).data('id');
    const appName = $(this).data('name');
    const description = $(this).data('description');
    const category = $(this).data('category');
    const icon = $(this).data('icon');
    const isActive = $(this).data('active');

    $('#appModalTitle').text('Edit App');
    $('#appId').val(appId);
    $('#appName').val(appName);
    $('#description').val(description);
    $('#category').val(category);
    $('#icon').val(icon);
    $('#isActive').val(isActive.toString());

    appModal.modal('show');
  });

  // Save App button click
  $('#btnSaveApp').on('click', function () {
    console.log('Save button clicked');

    // Validate form
    if (!appForm[0].checkValidity()) {
      appForm[0].reportValidity();
      return;
    }

    const appId = $('#appId').val();
    const appData = {
      appId: appId ? parseInt(appId) : null,
      appName: $('#appName').val(),
      description: $('#description').val() || null,
      category: $('#category').val() || null,
      icon: $('#icon').val() || 'tabler-app-window',
      isActive: $('#isActive').val() === 'true'
    };

    console.log('Saving app data:', appData);

    // Disable button during save
    $('#btnSaveApp').prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Saving...');

    $.ajax({
      url: '/Admin/Apps?handler=SaveApp',
      type: 'POST',
      contentType: 'application/json',
      headers: {
        RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val()
      },
      data: JSON.stringify(appData),
      success: function (response) {
        console.log('Save response:', response);
        if (response.success) {
          appModal.modal('hide');
          appsTable.ajax.reload();

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
        console.error('AJAX error saving app:', status, error, xhr);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'An error occurred while saving the app: ' + error,
          customClass: {
            confirmButton: 'btn btn-primary'
          }
        });
      },
      complete: function () {
        $('#btnSaveApp').prop('disabled', false).html('Save');
      }
    });
  });

  // Delete App button click
  $(document).on('click', '.delete-app', function () {
    const appId = $(this).data('id');
    const appName = $(this).data('name');

    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete app "${appName}"? This will set the app as inactive.`,
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
        console.log('Deleting app:', appId);
        $.ajax({
          url: '/Admin/Apps?handler=DeleteApp',
          type: 'POST',
          headers: {
            RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val()
          },
          data: {
            appId: appId,
            hardDelete: false
          },
          success: function (response) {
            console.log('Delete response:', response);
            if (response.success) {
              appsTable.ajax.reload();
              Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: response.message,
                customClass: {
                  confirmButton: 'btn btn-success'
                }
              });
            } else {
              console.error('Delete failed:', response.message);
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
            console.error('AJAX error deleting app:', status, error, xhr);
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: 'An error occurred while deleting the app: ' + error,
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
