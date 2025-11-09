package com.aloklibrarystudent

import android.app.Application
import com.aloklibrarystudent.data.AppContainer

class StudentApp : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}

