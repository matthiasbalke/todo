import java.util.UUID
import org.gradle.api.tasks.JavaExec

// Loaded only with -PcomposeDev. Never touch source inputs or production resources.
val triggerDirectory = layout.buildDirectory.dir("devtools")
val restartTrigger = triggerDirectory.map { it.file(".reloadtrigger") }

tasks.register("devReload") {
    group = "development"
    description = "Compile main sources/resources and request a DevTools restart after success"
    dependsOn("classes")
    inputs.files(fileTree("src/main"))
    outputs.file(restartTrigger)
    outputs.upToDateWhen { false }
    doLast {
        val trigger = restartTrigger.get().asFile
        trigger.parentFile.mkdirs()
        trigger.writeText(UUID.randomUUID().toString())
        logger.lifecycle("Updated DevTools restart trigger")
    }
}

tasks.named<JavaExec>("bootRun") {
    classpath += files(triggerDirectory)
    systemProperty("spring.devtools.restart.trigger-file", ".reloadtrigger")
}
