/**
 * Admin Permissions Management
 */

'use strict';

$(function () {
  console.log('Admin Permissions page loaded');

  let allApps = [];
  let selectedAppIds = new Set();
  let initialAppIds = new Set();
  let adminAppIds = new Set(); // Track which apps user is admin for
  let initialAdminAppIds = new Set(); // Track initial admin status
  let currentUserId = null;

  // Load users on page load
  loadUsers();
  loadApps();

  // User selection change
  $('#userSelect').on('changed.bs.select', function () {
    const userId = $(this).val();
    if (userId) {
      currentUserId = parseInt(userId);
      loadUserPermissions(currentUserId);
    } else {
      currentUserId = null;
      $('#appsContainer').hide();
      $('#selectUserMessage').show();
      $('#userInfo').hide();
      $('#btnSavePermissions').prop('disabled', true);
    }
  });

  // Save permissions button
  $('#btnSavePermissions').on('click', function () {
    if (!currentUserId) {
      return;
    }

    // Build permissions array with admin status
    const permissions = Array.from(selectedAppIds).map(appId => ({
      appId: appId,
      isAdmin: adminAppIds.has(appId)
    }));

    console.log('Saving permissions:', {
      userId: currentUserId,
      permissions: permissions
    });

    // Disable button during save
    $('#btnSavePermissions').prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Saving...');

    $.ajax({
      url: '/Admin/Permissions?handler=SavePermissions',
      type: 'POST',
      contentType: 'application/json',
      headers: {
        RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val()
      },
      data: JSON.stringify({
        userId: currentUserId,
        permissions: permissions
      }),
      success: function (response) {
        console.log('Save response:', response);
        if (response.success) {
          // Update initial state
          initialAppIds = new Set(selectedAppIds);
          initialAdminAppIds = new Set(adminAppIds);

          // Show success message
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: response.message,
            customClass: {
              confirmButton: 'btn btn-success'
            }
          });

          $('#btnSavePermissions').prop('disabled', true);
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
        console.error('AJAX error saving permissions:', status, error, xhr);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'An error occurred while saving permissions: ' + error,
          customClass: {
            confirmButton: 'btn btn-primary'
          }
        });
      },
      complete: function () {
        $('#btnSavePermissions').prop('disabled', !hasChanges()).html('<i class="ti tabler-device-floppy me-1"></i>Save Changes');
      }
    });
  });

  // Load users
  function loadUsers() {
    $.ajax({
      url: '/Admin/Permissions?handler=Users',
      type: 'GET',
      success: function (response) {
        console.log('Users loaded:', response);
        if (response.success && response.data.length > 0) {
          const select = $('#userSelect');
          select.find('option:not(:first)').remove();

          response.data.forEach(function (user) {
            const displayText = user.windowsusername + (user.imisid ? ' (' + user.imisid + ')' : '');
            select.append(
              $('<option></option>')
                .val(user.userid)
                .text(displayText)
                .data('imisid', user.imisid)
                .data('username', user.windowsusername)
            );
          });

          select.selectpicker('refresh');
        } else {
          console.error('No users found');
        }
      },
      error: function (xhr, error, code) {
        console.error('Error loading users:', error, xhr);
      }
    });
  }

  // Load apps
  function loadApps() {
    $.ajax({
      url: '/Admin/Permissions?handler=Apps',
      type: 'GET',
      success: function (response) {
        console.log('Apps loaded:', response);
        if (response.success) {
          allApps = response.data;
          if (allApps.length === 0) {
            $('#noAppsMessage').show();
          }
        } else {
          console.error('Error loading apps:', response.message);
        }
      },
      error: function (xhr, error, code) {
        console.error('Error loading apps:', error, xhr);
      }
    });
  }

  // Load user permissions
  function loadUserPermissions(userId) {
    $('#appsContainer').hide();
    $('#selectUserMessage').hide();

    $.ajax({
      url: '/Admin/Permissions?handler=UserPermissions&userId=' + userId,
      type: 'GET',
      success: function (response) {
        console.log('User permissions loaded:', response);
        if (response.success) {
          selectedAppIds = new Set(response.data.map(p => p.appId));
          initialAppIds = new Set(response.data.map(p => p.appId));
          adminAppIds = new Set(response.data.filter(p => p.isAdmin).map(p => p.appId));
          initialAdminAppIds = new Set(response.data.filter(p => p.isAdmin).map(p => p.appId));
          displayApps();
          updateSelectedCount();

          // Show user info
          const selectedOption = $('#userSelect option:selected');
          $('#selectedUserName').text(selectedOption.data('username'));
          const imisId = selectedOption.data('imisid');
          $('#selectedUserImis').text(imisId ? '(iMIS: ' + imisId + ')' : '');
          $('#userInfo').show();

          $('#appsContainer').show();
          $('#btnSavePermissions').prop('disabled', true);
        } else {
          console.error('Error loading permissions:', response.message);
        }
      },
      error: function (xhr, error, code) {
        console.error('Error loading user permissions:', error, xhr);
      }
    });
  }

  // Display apps
  function displayApps() {
    const grid = $('#appsGrid');
    grid.empty();

    if (allApps.length === 0) {
      return;
    }

    allApps.forEach(function (app) {
      const isSelected = selectedAppIds.has(app.appid);
      const isAdmin = adminAppIds.has(app.appid);
      const card = $(`
        <div class="col-md-6 col-lg-4">
          <div class="card app-card ${isSelected ? 'selected' : ''}" data-appid="${app.appid}">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                  <h6 class="mb-1">${app.appname}</h6>
                  <p class="text-muted small mb-0">${app.description || 'No description'}</p>
                </div>
                <div class="form-check form-check-lg">
                  <input class="form-check-input app-access-checkbox" type="checkbox" ${isSelected ? 'checked' : ''}>
                </div>
              </div>
              <div class="mt-2" style="${isSelected ? '' : 'display:none;'}">
                <div class="form-check">
                  <input class="form-check-input admin-checkbox" type="checkbox" ${isAdmin ? 'checked' : ''} ${!isSelected ? 'disabled' : ''}>
                  <label class="form-check-label text-muted small">Administrator</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      `);

      grid.append(card);
    });

    // Add click handlers for app cards
    $('.app-card').on('click', function (e) {
      // Don't toggle if clicking on checkboxes
      if ($(e.target).hasClass('form-check-input') || $(e.target).hasClass('form-check-label')) {
        return;
      }
      const appId = $(this).data('appid');
      toggleAppSelection(appId);
    });

    // Add change handler for admin checkboxes
    $('.admin-checkbox').on('change', function (e) {
      e.stopPropagation();
      const appId = $(this).closest('.app-card').data('appid');
      toggleAdminStatus(appId, $(this).is(':checked'));
    });

    // Prevent access checkbox from toggling the card
    $('.app-access-checkbox').on('click', function (e) {
      e.stopPropagation();
      const appId = $(this).closest('.app-card').data('appid');
      toggleAppSelection(appId);
    });
  }

  // Toggle app selection
  function toggleAppSelection(appId) {
    const card = $(`.app-card[data-appid="${appId}"]`);
    const adminSection = card.find('.mt-2');
    const adminCheckbox = card.find('.admin-checkbox');
    const accessCheckbox = card.find('.app-access-checkbox');

    if (selectedAppIds.has(appId)) {
      // Deselecting - remove access and admin status
      selectedAppIds.delete(appId);
      adminAppIds.delete(appId);
      card.removeClass('selected');
      accessCheckbox.prop('checked', false);
      adminCheckbox.prop('checked', false).prop('disabled', true);
      adminSection.hide();
    } else {
      // Selecting - grant access
      selectedAppIds.add(appId);
      card.addClass('selected');
      accessCheckbox.prop('checked', true);
      adminCheckbox.prop('disabled', false);
      adminSection.show();
    }

    updateSelectedCount();
    $('#btnSavePermissions').prop('disabled', !hasChanges());
  }

  // Toggle admin status
  function toggleAdminStatus(appId, isAdmin) {
    if (isAdmin) {
      adminAppIds.add(appId);
    } else {
      adminAppIds.delete(appId);
    }

    $('#btnSavePermissions').prop('disabled', !hasChanges());
  }

  // Update selected count
  function updateSelectedCount() {
    $('#selectedCount').text(selectedAppIds.size + ' selected');
  }

  // Check if there are changes
  function hasChanges() {
    // Check if selected apps changed
    if (selectedAppIds.size !== initialAppIds.size) {
      return true;
    }

    for (let appId of selectedAppIds) {
      if (!initialAppIds.has(appId)) {
        return true;
      }
    }

    // Check if admin status changed
    if (adminAppIds.size !== initialAdminAppIds.size) {
      return true;
    }

    for (let appId of adminAppIds) {
      if (!initialAdminAppIds.has(appId)) {
        return true;
      }
    }

    for (let appId of initialAdminAppIds) {
      if (!adminAppIds.has(appId)) {
        return true;
      }
    }

    return false;
  }
});
