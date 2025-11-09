package com.aloklibrarystudent.ui.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import com.aloklibrarystudent.R
import com.aloklibrarystudent.data.model.NoteDto

@Composable
internal fun NoteEditorDialog(
    existingNote: NoteDto?,
    isSubmitting: Boolean,
    submitError: String?,
    onDismiss: () -> Unit,
    onSubmit: (String, String) -> Unit
) {
    var title by rememberSaveable(existingNote?.id) { mutableStateOf(existingNote?.title ?: "") }
    var content by rememberSaveable(existingNote?.id) { mutableStateOf(existingNote?.content ?: "") }
    var titleError by remember { mutableStateOf<String?>(null) }
    var contentError by remember { mutableStateOf<String?>(null) }

    val titleRequired = stringResource(id = R.string.notes_validation_title)
    val contentRequired = stringResource(id = R.string.notes_validation_content)
    val contentLimit = stringResource(id = R.string.notes_limit_message)

    fun validate(): Boolean {
        titleError = null
        contentError = null
        if (title.isBlank()) {
            titleError = titleRequired
        }
        when {
            content.isBlank() -> contentError = contentRequired
            content.length > 1000 -> contentError = contentLimit
        }
        return titleError == null && contentError == null
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            Button(onClick = {
                if (validate()) onSubmit(title, content)
            }, enabled = !isSubmitting) {
                Text(text = stringResource(id = R.string.notes_save))
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !isSubmitting) {
                Text(text = stringResource(id = R.string.notes_cancel))
            }
        },
        title = {
            Text(text = if (existingNote == null) stringResource(id = R.string.notes_add) else stringResource(id = R.string.notes_edit))
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text(text = stringResource(id = R.string.notes_field_title)) },
                    singleLine = true,
                    enabled = !isSubmitting,
                    isError = titleError != null,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                    modifier = Modifier.fillMaxWidth()
                )
                titleError?.let {
                    Text(text = it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
                }
                OutlinedTextField(
                    value = content,
                    onValueChange = { content = it },
                    label = { Text(text = stringResource(id = R.string.notes_field_content)) },
                    enabled = !isSubmitting,
                    isError = contentError != null,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(160.dp)
                )
                contentError?.let {
                    Text(text = it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
                }
                submitError?.let {
                    Text(text = it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
                }
            }
        }
    )
}

@Composable
internal fun ConfirmDeleteDialog(
    note: NoteDto,
    isDeleting: Boolean,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            Button(onClick = onConfirm, enabled = !isDeleting) {
                Text(text = stringResource(id = R.string.notes_delete))
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !isDeleting) {
                Text(text = stringResource(id = R.string.notes_cancel))
            }
        },
        title = { Text(text = stringResource(id = R.string.notes_delete)) },
        text = {
            Column {
                Text(text = stringResource(id = R.string.notes_delete_confirm))
                if (isDeleting) {
                    Spacer(modifier = Modifier.height(12.dp))
                    LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                }
            }
        }
    )
}
