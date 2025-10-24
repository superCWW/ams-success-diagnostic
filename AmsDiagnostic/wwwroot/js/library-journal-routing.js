/**
 * Library Journal Routing Management
 */

'use strict';

$(function () {
  console.log('Library Journal Routing page loaded');

  const routingModal = $('#routingModal');
  const routingForm = $('#routingForm');
  const journalId = $('#routingJournalId').val();
  let routingList = [];

  // Get CSRF token
  function getAntiForgeryToken() {
    return $('input[name="__RequestVerificationToken"]').val();
  }

  // Load routing entries
  function loadRoutingEntries() {
    $.ajax({
      url: `/LibraryAdmin/Journal?handler=RoutingEntries&journalId=${journalId}`,
      type: 'GET',
      success: function (response) {
        if (response.success) {
          console.log('Loaded ' + response.data.length + ' routing entries');
          routingList = response.data;
          renderRoutingList();
        } else {
          console.error('Error loading routing entries:', response.message);
          Swal.fire('Error', response.message || 'Error loading routing entries', 'error');
        }
      },
      error: function (xhr, error, code) {
        console.error('AJAX Error loading routing entries:', error, xhr);
        Swal.fire('Error', 'Failed to load routing entries', 'error');
      }
    });
  }

  // Render routing list
  function renderRoutingList() {
    const listContainer = $('#routingList');
    listContainer.empty();

    if (routingList.length === 0) {
      listContainer.append('<li class="list-group-item text-muted text-center">No routing entries yet. Click "Add Name" to get started.</li>');
      return;
    }

    routingList.forEach(function (entry, index) {
      const listItem = $(`
        <li class="list-group-item d-flex justify-content-between align-items-center" data-routing-id="${entry.routingID}" data-order="${entry.routingOrder}" draggable="true">
          <div class="d-flex align-items-center">
            <i class="ti tabler-grip-vertical me-2 text-muted" style="cursor: move;"></i>
            <span class="badge bg-label-secondary me-2">${index + 1}</span>
            <span>${entry.name}</span>
          </div>
          <div>
            <a href="javascript:void(0);" class="text-primary me-2 link-edit-routing" data-id="${entry.routingID}" title="Edit">
              <i class="ti tabler-edit"></i> Edit
            </a>
            <a href="javascript:void(0);" class="text-danger link-delete-routing" data-id="${entry.routingID}" title="Delete">
              <i class="ti tabler-trash"></i> Delete
            </a>
          </div>
        </li>
      `);

      listContainer.append(listItem);
    });

    // Initialize drag and drop
    initializeDragAndDrop();
  }

  // Initialize drag and drop functionality
  function initializeDragAndDrop() {
    const items = document.querySelectorAll('#routingList li[draggable="true"]');
    let draggedItem = null;

    items.forEach(item => {
      item.addEventListener('dragstart', function (e) {
        draggedItem = this;
        this.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
      });

      item.addEventListener('dragend', function (e) {
        this.style.opacity = '1';
      });

      item.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const afterElement = getDragAfterElement(this.parentElement, e.clientY);
        const currentElement = draggedItem;

        if (afterElement == null) {
          this.parentElement.appendChild(currentElement);
        } else {
          this.parentElement.insertBefore(currentElement, afterElement);
        }
      });

      item.addEventListener('drop', function (e) {
        e.preventDefault();
        updateRoutingOrder();
      });
    });
  }

  // Get drag after element
  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('li[draggable="true"]:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  // Update routing order after drag and drop
  function updateRoutingOrder() {
    const items = $('#routingList li[data-routing-id]');
    const updates = [];

    items.each(function (index) {
      const routingId = parseInt($(this).data('routing-id'));
      const newOrder = index + 1;

      updates.push({
        routingID: routingId,
        routingOrder: newOrder
      });

      // Update badge number
      $(this).find('.badge').text(newOrder);
    });

    // Save to server
    $.ajax({
      url: '/LibraryAdmin/Journal?handler=UpdateRoutingOrder',
      type: 'POST',
      contentType: 'application/json',
      headers: {
        'RequestVerificationToken': getAntiForgeryToken()
      },
      data: JSON.stringify(updates),
      success: function (response) {
        if (response.success) {
          console.log('Routing order updated successfully');
          // Reload to get fresh data
          loadRoutingEntries();
        } else {
          Swal.fire('Error', response.message || 'Failed to update routing order', 'error');
        }
      },
      error: function (xhr, error, code) {
        console.error('Error updating routing order:', error, xhr);
        Swal.fire('Error', 'Failed to update routing order', 'error');
      }
    });
  }

  // Add Name button click
  $('#btnAddRouting').on('click', function () {
    console.log('Add Name button clicked');
    routingForm[0].reset();
    $('#routingId').val('0');
    $('#routingJournalIdField').val(journalId);
    $('#routingModalTitle').text('Add Routing Name');
    routingModal.modal('show');
  });

  // Edit link click (delegated event)
  $('#routingList').on('click', '.link-edit-routing', function () {
    const routingId = $(this).data('id');
    console.log('Edit link clicked for routing:', routingId);

    // Fetch routing data
    $.ajax({
      url: `/LibraryAdmin/Journal?handler=RoutingEntry&routingId=${routingId}`,
      type: 'GET',
      success: function (response) {
        if (response.success && response.data) {
          const entry = response.data;
          console.log('Routing data loaded:', entry);

          $('#routingId').val(entry.routingID);
          $('#routingJournalIdField').val(entry.journalID);
          $('#routingName').val(entry.name);

          $('#routingModalTitle').text('Edit Routing Name');
          routingModal.modal('show');
        } else {
          Swal.fire('Error', response.message || 'Failed to load routing entry', 'error');
        }
      },
      error: function (xhr, error, code) {
        console.error('Error loading routing entry:', error, xhr);
        Swal.fire('Error', 'Failed to load routing entry data', 'error');
      }
    });
  });

  // Delete link click (delegated event)
  $('#routingList').on('click', '.link-delete-routing', function () {
    const routingId = $(this).data('id');
    console.log('Delete link clicked for routing:', routingId);

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
          url: '/LibraryAdmin/Journal?handler=DeleteRouting',
          type: 'POST',
          contentType: 'application/json',
          headers: {
            'RequestVerificationToken': getAntiForgeryToken()
          },
          data: JSON.stringify(routingId),
          success: function (response) {
            if (response.success) {
              Swal.fire('Deleted!', 'Routing entry has been deleted.', 'success');
              loadRoutingEntries();
            } else {
              Swal.fire('Error', response.message || 'Failed to delete routing entry', 'error');
            }
          },
          error: function (xhr, error, code) {
            console.error('Error deleting routing entry:', error, xhr);
            Swal.fire('Error', 'Failed to delete routing entry', 'error');
          }
        });
      }
    });
  });

  // Save button click
  $('#btnSaveRouting').on('click', function () {
    console.log('Save Routing button clicked');

    // Validate
    if (!$('#routingName').val().trim()) {
      Swal.fire('Validation Error', 'Name is required', 'warning');
      return;
    }

    const routingData = {
      routingID: parseInt($('#routingId').val()) || 0,
      journalID: parseInt($('#routingJournalIdField').val()),
      name: $('#routingName').val(),
      routingOrder: 0 // Will be set by server
    };

    console.log('Saving routing data:', routingData);

    $.ajax({
      url: '/LibraryAdmin/Journal?handler=SaveRouting',
      type: 'POST',
      contentType: 'application/json',
      headers: {
        'RequestVerificationToken': getAntiForgeryToken()
      },
      data: JSON.stringify(routingData),
      success: function (response) {
        if (response.success) {
          Swal.fire('Success', response.message || 'Routing entry saved successfully', 'success');
          routingModal.modal('hide');
          loadRoutingEntries();
        } else {
          Swal.fire('Error', response.message || 'Failed to save routing entry', 'error');
        }
      },
      error: function (xhr, error, code) {
        console.error('Error saving routing entry:', error, xhr);
        Swal.fire('Error', 'Failed to save routing entry', 'error');
      }
    });
  });

  // Load routing entries when Routing tab is shown
  $('button[data-bs-target="#routing"]').on('shown.bs.tab', function () {
    console.log('Routing tab shown, loading entries');
    loadRoutingEntries();
  });

  // Initial load if Routing tab is active
  if ($('#routing').hasClass('active')) {
    loadRoutingEntries();
  }
});
