var Monitor = require(".."),
    expect = require("expect.js"),
    sinon = require("sinon"),
    EventEmitter = require("events").EventEmitter,
    Datum = require("bodewell-datum");

var count = (function*() {
    var i = 0;
    while (true) yield ++i;
})()

function uniq() {
    return count.next().value;
}

describe("Monitor", () => {
    it("should extend EventEmitter", () => {
        expect(new Monitor(uniq())).to.be.a(Monitor);
        expect(new Monitor(uniq())).to.be.an(EventEmitter);
    });

    it("should work without new keyword", () => {
        expect(Monitor(uniq())).to.be.an(EventEmitter);
    });

    describe(".type(function)", () => {
        it("should return new type extending Monitor", () => {
            var MyMonitor = Monitor.type(() => {});
            expect(MyMonitor).to.be.a("function");
            expect(MyMonitor(uniq())).to.be.a(MyMonitor);
            expect(MyMonitor(uniq())).to.be.a(Monitor);
        });

        it("should call provided function with constructor args", () => {
            var init = sinon.spy(),
                MyMonitor = Monitor.type(init),
                data = {};

            MyMonitor(uniq(), data);
            expect(init.calledOnce).to.be(true);
            expect(init.calledWith(data)).to.be(true);
        });
    });

    describe("#state", () => {
        it("should be initialized to Monitor.unknown", () => {
            expect(Monitor(uniq()).state).to.be(Monitor.unknown);
        });
    });

    describe("#data", () => {
        it("should be initialized to empty array", () => {
            expect(Monitor(uniq()).data).to.be.an("array");
            expect(Monitor(uniq()).data.length).to.be(0);
        });
    });

    describe("#record(number)", () => {
        it("should record data point", () => {
            var monitor = Monitor(uniq());

            expect(monitor.data.length).to.be(0);

            monitor.record(4);
            expect(monitor.data.length).to.be(1);
            expect(monitor.data[0]).to.be.a(Datum);
            expect(monitor.data[0].value).to.be(4);
        });

        it("should emit 'data' event", () => {
            var monitor = Monitor(uniq()),
                data = sinon.spy();

            monitor.on("data", data);
            monitor.record(3);
            expect(data.calledOnce).to.be(true);
            expect(data.calledWith(monitor.data[0])).to.be(true);
        });
    });

    describe("#erase()", () => {
        it("should clear recorded data", () => {
            var monitor = Monitor(uniq()),
                data = monitor.data;

            monitor.record(3);
            monitor.record(5);
            expect(data.length).to.be(2);

            monitor.erase();
            expect(monitor.data).to.be(data);
            expect(data.length).to.be(0);
        });
    });

    describe("#trigger()", () => {
        it("should set state to Monitor.triggered", () => {
            var monitor = Monitor(uniq());
            monitor.trigger();
            expect(monitor.state).to.be(Monitor.triggered);
        });

        it("should emit 'triggered' event if state is Monitor.ok", () => {
            var monitor = Monitor(uniq()),
                triggered = sinon.spy();

            monitor.on("triggered", triggered);
            monitor.state = Monitor.ok;
            monitor.trigger();
            expect(triggered.calledOnce).to.be(true);
        });

        it("should not emit 'triggered' if state not Monitor.ok", () => {
            var monitor = Monitor(uniq()),
                triggered = sinon.spy();

            monitor.state = Monitor.unknown;
            monitor.trigger();
            expect(triggered.called).to.be(false);

            monitor.state = Monitor.triggered;
            monitor.trigger();
            expect(triggered.called).to.be(false);
        });
    });

    describe("#ok()", () => {
        it("should set state to Monitor.ok", () => {
            var monitor = Monitor(uniq());
            monitor.ok();
            expect(monitor.state).to.be(Monitor.ok);
        });

        it("should emit 'ok' event if state is Monitor.triggered", () => {
            var monitor = Monitor(uniq()),
                ok = sinon.spy();

            monitor.on("ok", ok);
            monitor.state = Monitor.triggered;
            monitor.ok();
            expect(ok.calledOnce).to.be(true);
        });

        it("should not emit 'ok' if state not Monitor.triggered", () => {
            var monitor = Monitor(uniq()),
                ok = sinon.spy();

            monitor.state = Monitor.unknown;
            monitor.ok();
            expect(ok.called).to.be(false);

            monitor.state = Monitor.ok;
            monitor.ok();
            expect(ok.called).to.be(false);
        });
    });

    describe("#incident(*)", () => {
        it("should emit 'incident' event", () => {
            var monitor = Monitor(uniq()),
                incident = sinon.spy(),
                data = {};

            monitor.on("incident", incident);
            monitor.incident(data);
            expect(incident.calledOnce).to.be(true);
            expect(incident.calledWith(data)).to.be(true);
        });
    });
});

