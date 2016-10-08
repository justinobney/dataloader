import Loader from '../src/loader.js';
import { Promise } from 'es6-promise';

describe('Loader', () => {
  jasmine.clock().install();

  afterEach(() => {
    jasmine.clock().tick(5);
  })

  describe('batch success', () => {
    beforeEach(function () {
      spyOn(obj, 'getData').and.callThrough();
    });

    it('debounces the call', () => {
      const loader = new Loader(keys => obj.getData(keys));
      loader.load(1);
      expect(obj.getData).not.toHaveBeenCalledWith([1]);
      jasmine.clock().tick(5);
      expect(obj.getData).toHaveBeenCalledWith([1]);
    });

    it('collects the arguments', () => {
      const loader = new Loader(keys => obj.getData(keys));
      loader.load(1);
      loader.load(2);
      expect(obj.getData).not.toHaveBeenCalledWith([1,2]);
      jasmine.clock().tick(5);
      expect(obj.getData).toHaveBeenCalledWith([1,2]);
      expect(obj.getData.calls.count()).toEqual(1);
    });

    it('can set max batch limit', () => {
      const loader = new Loader(
        keys => obj.getData(keys),
        {limit:2}
      );
      loader.load(1);
      loader.load(2);
      loader.load(3);

      expect(obj.getData).toHaveBeenCalledWith([1,2]);
      expect(obj.getData).not.toHaveBeenCalledWith([3]);
      expect(obj.getData.calls.count()).toEqual(1);

      jasmine.clock().tick(5);
      expect(obj.getData).toHaveBeenCalledWith([3]);
      expect(obj.getData.calls.count()).toEqual(2);
    });

    it('can force execution', () => {
      const loader = new Loader(
        keys => obj.getData(keys));
      loader.load(1);
      loader.load(2);
      loader.flush();

      expect(obj.getData).toHaveBeenCalledWith([1,2]);
      expect(obj.getData.calls.count()).toEqual(1);
    });

    it('can clear cache', () => {
      const loader = new Loader(
        keys => obj.getData(keys)
      );

      loader.load(1);
      jasmine.clock().tick(5);
      expect(obj.getData.calls.count()).toEqual(1);

      loader.clear(1);
      loader.load(1);
      jasmine.clock().tick(5);
      expect(obj.getData.calls.count()).toEqual(2);
    });

    it('can clear all', () => {
      const loader = new Loader(
        keys => obj.getData(keys)
      );

      loader.load(1);
      jasmine.clock().tick(5);
      expect(obj.getData.calls.count()).toEqual(1);

      loader.load(2);
      jasmine.clock().tick(5);
      expect(obj.getData.calls.count()).toEqual(2);

      loader.clear();
      loader.load(1);
      loader.load(2);
      jasmine.clock().tick(5);
      expect(obj.getData.calls.count()).toEqual(3);
      expect(obj.getData).toHaveBeenCalledWith([1,2]);
    });

    it('does not duplicate keys', () => {
      const loader = new Loader(keys => obj.getData(keys));
      loader.load(1);
      loader.load(1);
      jasmine.clock().tick(5);
      expect(obj.getData).toHaveBeenCalledWith([1]);
    });

    it('returns a promise', () => {
      const loader = new Loader(keys => obj.getData(keys));
      const promise = loader.load(1);
      expect(promise.then).toBeDefined();
    });

    it('maps keys to promises', () => {
      const loader = new Loader(keys => obj.getData(keys));
      const promiseA = loader.load(1);
      const promiseB = loader.load(1);
      expect(promiseA).toEqual(promiseB);
    });

    it('returned promises should resolve with individual items', (done) => {
      const loader = new Loader(keys => obj.getData(keys));

      const promiseA = loader.load(2).then(resp => {
        expect(resp.id).toEqual(2);
      });

      const promiseB = loader.load(1).then(resp => {
        expect(resp.id).toEqual(1);
      });

      jasmine.clock().tick(5);

      expect(obj.getData).toHaveBeenCalledWith([2,1]);
      expect(obj.getData.calls.count()).toBe(1);

      Promise.all([promiseA, promiseB]).then(() => {
        done();
      });
    });
  })

  describe('batch fails', () => {
    beforeEach(function () {
      spyOn(obj, 'getData').and.returnValue(Promise.reject());
    });

    it('batch fails should reject promises', (done) => {
      const loader = new Loader(keys => obj.getData(keys));

      const rejectionA = jasmine.createSpy(`'load 1 failed'`);
      const rejectionB = jasmine.createSpy(`'load 2 failed'`);

      const promiseA = loader.load(1).then(undefined, rejectionA);
      const promiseB = loader.load(2).then(undefined, rejectionB);

      jasmine.clock().tick(5);

      Promise.all([promiseA, promiseB]).then(() => {
        expect(obj.getData.calls.count()).toBe(1);
        expect(rejectionA).toHaveBeenCalled();
        expect(rejectionB).toHaveBeenCalled();

        done();
      });
    });
  })
});

const obj = {
  getData(keys) {
    return Promise.resolve(
      keys.map(
        x => ({
          id:x,
          prop: `foo prop ${x}`
        })
      )
    );
  }
}