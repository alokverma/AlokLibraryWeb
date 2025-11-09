package com.aloklibrarystudent.ui.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aloklibrarystudent.R

private enum class LoginMode {
    STUDENT,
    PORTAL
}

@Composable
fun LoginScreen(
    state: AuthUiState.Unauthenticated,
    onLogin: (String, String) -> Unit,
    onRetryLastError: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val focusManager = LocalFocusManager.current
    val usernameFocusRequester = remember { FocusRequester() }
    var username by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var isPasswordVisible by rememberSaveable { mutableStateOf(false) }
    var validationError by remember { mutableStateOf<String?>(null) }
    var loginMode by rememberSaveable { mutableStateOf(LoginMode.STUDENT) }

    val missingCredentialsMessage = stringResource(id = R.string.login_error_missing_credentials)

    LaunchedEffect(loginMode) {
        validationError = null
        if (loginMode == LoginMode.STUDENT) {
            usernameFocusRequester.requestFocus()
        } else {
            focusManager.clearFocus(force = true)
        }
    }

    fun submit() {
        validationError = null
        if (username.isBlank() || password.isBlank()) {
            validationError = missingCredentialsMessage
            return
        }
        focusManager.clearFocus(force = true)
        onLogin(username.trim(), password)
    }

    Surface(modifier = modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = stringResource(id = R.string.login_title),
                style = MaterialTheme.typography.headlineMedium
            )
            Text(
                text = stringResource(id = R.string.login_subtitle),
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.primary
            )

            Spacer(modifier = Modifier.height(32.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                ModeSelectionButton(
                    text = stringResource(id = R.string.login_mode_student),
                    selected = loginMode == LoginMode.STUDENT
                ) { loginMode = LoginMode.STUDENT }
                ModeSelectionButton(
                    text = stringResource(id = R.string.login_mode_portal),
                    selected = loginMode == LoginMode.PORTAL
                ) { loginMode = LoginMode.PORTAL }
            }

            Text(
                text = stringResource(id = R.string.login_mode_switch_hint),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp)
            )

            if (loginMode == LoginMode.PORTAL) {
                Text(
                    text = stringResource(id = R.string.login_portal_description),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.tertiary,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 12.dp)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            OutlinedTextField(
                value = username,
                onValueChange = {
                    username = it
                    validationError = null
                },
                leadingIcon = {
                    Icon(imageVector = Icons.Default.Person, contentDescription = null)
                },
                label = { Text(text = stringResource(id = R.string.label_username)) },
                singleLine = true,
                enabled = !state.isProcessing,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                modifier = Modifier
                    .fillMaxWidth()
                    .focusRequester(usernameFocusRequester)
            )

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = password,
                onValueChange = {
                    password = it
                    validationError = null
                },
                leadingIcon = {
                    Icon(imageVector = Icons.Default.Lock, contentDescription = null)
                },
                label = { Text(text = stringResource(id = R.string.login_password_label)) },
                singleLine = true,
                enabled = !state.isProcessing,
                visualTransformation = if (isPasswordVisible) {
                    VisualTransformation.None
                } else {
                    PasswordVisualTransformation()
                },
                trailingIcon = {
                    TextButton(onClick = { isPasswordVisible = !isPasswordVisible }) {
                        val toggleText = if (isPasswordVisible) {
                            stringResource(id = R.string.login_hide_password)
                        } else {
                            stringResource(id = R.string.login_show_password)
                        }
                        Text(text = toggleText)
                    }
                },
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                keyboardActions = KeyboardActions(onDone = { submit() }),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(8.dp))

            val errorMessage = validationError ?: state.errorMessage
            if (!errorMessage.isNullOrEmpty()) {
                Text(
                    text = errorMessage,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier
                        .align(Alignment.Start)
                        .padding(top = 4.dp)
                )
                if (onRetryLastError != null && !state.isProcessing) {
                    TextButton(onClick = onRetryLastError) {
                        Text(text = stringResource(id = R.string.portal_retry))
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = { submit() },
                modifier = Modifier.fillMaxWidth(),
                enabled = !state.isProcessing
            ) {
                if (state.isProcessing) {
                    CircularProgressIndicator(
                        modifier = Modifier
                            .height(20.dp)
                            .padding(end = 12.dp),
                        strokeWidth = 2.dp
                    )
                }
                val buttonText = if (loginMode == LoginMode.PORTAL) {
                    stringResource(id = R.string.login_portal_button)
                } else {
                    stringResource(id = R.string.login_sign_in)
                }
                Text(text = buttonText)
            }
        }
    }
}

@Composable
private fun RowScope.ModeSelectionButton(
    text: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    if (selected) {
        FilledTonalButton(
            onClick = onClick,
            modifier = Modifier.weight(1f)
        ) {
            Text(text = text, lineHeight = 18.sp)
        }
    } else {
        OutlinedButton(
            onClick = onClick,
            modifier = Modifier.weight(1f)
        ) {
            Text(text = text, lineHeight = 18.sp)
        }
    }
}

