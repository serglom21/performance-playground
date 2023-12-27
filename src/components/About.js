import React, { Component } from 'react';
import * as Sentry from "@sentry/react";
import { createBrowserHistory } from "history";

class About extends Component {

    operations = {
        "products" : {
            "name" : "products request",
            "url" : "https://application-monitoring-flask-dot-sales-engineering-sf.appspot.com/products",
            "method" : "GET",
            "op" : "http.client",
            "parentTransaction": true
        }
    }

    async componentDidMount(){
        const currentDate = new Date();
        const products_request = fetch(this.operations["products"].url, { 
            method: this.operations["products"].method
        });

        this.operations["products"]["start"] = currentDate.getTime();
        this.operations["products"]["response"] = await products_request;
        this.operations["products"]["end"] = currentDate.getTime();
        sessionStorage.setItem("requests", JSON.stringify(this.operations));

        const history = createBrowserHistory();

        Sentry.init({
            dsn: "{DSN}",
            tracesSampleRate: 1,
            integrations: [
                new Sentry.BrowserTracing({
                  // Can also use reactRouterV3Instrumentation or reactRouterV4Instrumentation
                  routingInstrumentation: Sentry.reactRouterV5Instrumentation(history),
                  beforeNavigate: (context) => {
                    console.log("CONTEXT ", context);
                    return context;
                  }
                }),
            ],

        });

        const sessionRequests = sessionStorage.getItem("requests");

        for (const operation in sessionRequests) {
            // create new transaction
            if (sessionRequests[operation].parentTransaction) {
                const currentTransaction = Sentry.getCurrentHub().getScope().getTransaction();
                currentTransaction.finish();
                Sentry.startTransaction({ name: this.operations[operation].name});
                continue;
            }
            // attach a span to existing automatic transaction
            Sentry.startSpan({ name: sessionRequests[operation].name, op: sessionRequests[operation].op}, (span) => {
                span.setData("description", `${sessionRequests[operation].method} ${sessionRequests[operation].url}`);
            })
        }
    }

    render() {
        return (
            <h1>This is my about component</h1>
        )
    }
}

export default About;