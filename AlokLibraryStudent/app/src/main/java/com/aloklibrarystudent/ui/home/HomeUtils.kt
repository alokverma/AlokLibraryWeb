package com.aloklibrarystudent.ui.home

import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter

internal fun formatDate(isoString: String): String {
    return runCatching {
        LocalDate.parse(isoString)
            .format(DateTimeFormatter.ofPattern("dd MMM yyyy"))
    }.getOrElse { isoString }
}

internal fun formatDateTime(isoString: String): String {
    return runCatching {
        Instant.parse(isoString)
            .atZone(ZoneId.systemDefault())
            .format(DateTimeFormatter.ofPattern("MMMM d, yyyy 'at' hh:mm a"))
    }.getOrElse { isoString }
}
