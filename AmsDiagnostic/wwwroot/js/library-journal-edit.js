/**
 * Library Journal Edit Management
 */

'use strict';

$(function () {
  console.log('Library Journal Edit page loaded');

  const journalModal = $('#journalModal');
  const journalForm = $('#journalForm');
  const journalId = $('#journalIdField').val();

  // Get CSRF token
  function getAntiForgeryToken() {
    return $('input[name="__RequestVerificationToken"]').val();
  }

  // Edit Journal button click
  $('#btnEditJournal').on('click', function () {
    console.log('Edit Journal button clicked');

    // Fetch journal data
    $.ajax({
      url: `/LibraryAdmin/Journal?handler=JournalData&journalId=${journalId}`,
      type: 'GET',
      success: function (response) {
        if (response.success && response.data) {
          const journal = response.data;
          console.log('Journal data loaded:', journal);

          // Populate form fields
          $('#journalIdField').val(journal.journalID);
          $('#titleField').val(journal.title);
          $('#publisherField').val(journal.publisher);
          $('#authorsField').val(journal.authors);
          $('#contactField').val(journal.contact);
          $('#phoneNumberField').val(journal.phoneNumber);
          $('#emailField').val(journal.email);
          $('#priceField').val(journal.price);
          $('#copiesField').val(journal.copies);
          $('#activeField').prop('checked', journal.active);
          $('#notesField').val(journal.notes);
          $('#adminNotesField').val(journal.adminNotes);
          $('#genieUniqRecNumField').val(journal.genieUniqRecNum);
          $('#geniePublisherGUIDField').val(journal.geniePublisherGUID);
          $('#geniefSystemKeyField').val(journal.geniefSystemKey);
          $('#genieAccountNoField').val(journal.genieAccountNo);

          journalModal.modal('show');
        } else {
          Swal.fire('Error', response.message || 'Failed to load journal', 'error');
        }
      },
      error: function (xhr, error, code) {
        console.error('Error loading journal:', error, xhr);
        Swal.fire('Error', 'Failed to load journal data', 'error');
      }
    });
  });

  // Save Journal button click
  $('#btnSaveJournal').on('click', function () {
    console.log('Save Journal button clicked');

    // Validate required fields
    if (!$('#titleField').val().trim()) {
      Swal.fire('Validation Error', 'Title is required', 'warning');
      return;
    }

    const journalData = {
      journalID: parseInt($('#journalIdField').val()),
      title: $('#titleField').val(),
      publisher: $('#publisherField').val(),
      authors: $('#authorsField').val(),
      contact: $('#contactField').val(),
      phoneNumber: $('#phoneNumberField').val(),
      email: $('#emailField').val(),
      price: $('#priceField').val(),
      copies: $('#copiesField').val(),
      active: $('#activeField').is(':checked'),
      notes: $('#notesField').val(),
      adminNotes: $('#adminNotesField').val(),
      genieUniqRecNum: $('#genieUniqRecNumField').val(),
      geniePublisherGUID: $('#geniePublisherGUIDField').val(),
      geniefSystemKey: $('#geniefSystemKeyField').val(),
      genieAccountNo: $('#genieAccountNoField').val()
    };

    console.log('Saving journal data:', journalData);

    $.ajax({
      url: '/LibraryAdmin/Journal?handler=UpdateJournal',
      type: 'POST',
      contentType: 'application/json',
      headers: {
        'RequestVerificationToken': getAntiForgeryToken()
      },
      data: JSON.stringify(journalData),
      success: function (response) {
        if (response.success) {
          Swal.fire({
            title: 'Success',
            text: response.message || 'Journal updated successfully',
            icon: 'success',
            confirmButtonText: 'OK'
          }).then(() => {
            // Reload the page to show updated data
            location.reload();
          });
        } else {
          Swal.fire('Error', response.message || 'Failed to save journal', 'error');
        }
      },
      error: function (xhr, error, code) {
        console.error('Error saving journal:', error, xhr);
        Swal.fire('Error', 'Failed to save journal', 'error');
      }
    });
  });
});
