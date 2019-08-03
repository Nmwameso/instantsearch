import jsHelper, {
  SearchResults,
  SearchParameters,
} from 'algoliasearch-helper';
import connectRatingMenu from '../connectRatingMenu';

describe('connectRatingMenu', () => {
  // @TODO: once we've migrate away from `getConfiguration` update
  // the function and use it at least for the lifecycle.
  // const getInitializedWidget = (config = {}) => {
  //   const rendering = jest.fn();
  //   const makeWidget = connectRatingMenu(rendering);

  //   const attribute = 'grade';
  //   const widget = makeWidget({
  //     attribute,
  //     ...config,
  //   });

  //   const initialConfig = widget.getConfiguration(new SearchParameters({}));
  //   const helper = jsHelper({}, '', initialConfig);
  //   helper.search = jest.fn();

  //   widget.init({
  //     helper,
  //     state: helper.state,
  //     createURL: () => '#',
  //   });

  //   const { refine } = rendering.mock.calls[0][0];

  //   return [widget, helper, refine];
  // };

  describe('Usage', () => {
    it('throws without render function', () => {
      expect(() => {
        connectRatingMenu()({});
      }).toThrowErrorMatchingInlineSnapshot(`
"The render function is not valid (got type \\"undefined\\").

See documentation: https://www.algolia.com/doc/api-reference/widgets/rating-menu/js/#connector"
`);
    });

    it('throws without attribute', () => {
      expect(() => {
        connectRatingMenu(() => {})({ attribute: undefined });
      }).toThrowErrorMatchingInlineSnapshot(`
"The \`attribute\` option is required.

See documentation: https://www.algolia.com/doc/api-reference/widgets/rating-menu/js/#connector"
`);
    });

    it('is a widget', () => {
      const render = jest.fn();
      const unmount = jest.fn();

      const customRatingMenu = connectRatingMenu(render, unmount);
      const widget = customRatingMenu({ attribute: 'facet' });

      expect(widget).toEqual(
        expect.objectContaining({
          $$type: 'ais.ratingMenu',
          init: expect.any(Function),
          render: expect.any(Function),
          dispose: expect.any(Function),
          getConfiguration: expect.any(Function),
          getWidgetState: expect.any(Function),
          getWidgetSearchParameters: expect.any(Function),
        })
      );
    });
  });

  it('Renders during init and render', () => {
    // test that the dummyRendering is called with the isFirstRendering
    // flag set accordingly
    const rendering = jest.fn();
    const makeWidget = connectRatingMenu(rendering);

    const attribute = 'grade';
    const widget = makeWidget({
      attribute,
    });

    const config = widget.getConfiguration(new SearchParameters({}));
    expect(config).toEqual(
      new SearchParameters({
        disjunctiveFacets: [attribute],
        disjunctiveFacetsRefinements: {
          grade: [],
        },
      })
    );

    const helper = jsHelper({}, '', config);
    helper.search = jest.fn();

    widget.init({
      helper,
      state: helper.state,
      createURL: () => '#',
    });

    {
      // should call the rendering once with isFirstRendering to true
      expect(rendering).toHaveBeenCalledTimes(1);
      const isFirstRendering =
        rendering.mock.calls[rendering.mock.calls.length - 1][1];
      expect(isFirstRendering).toBe(true);

      // should provide good values for the first rendering
      const { items, widgetParams } = rendering.mock.calls[
        rendering.mock.calls.length - 1
      ][0];
      expect(items).toEqual([]);
      expect(widgetParams).toEqual({ attribute });
    }

    widget.render({
      results: new SearchResults(helper.state, [
        {
          facets: {
            [attribute]: { 0: 5, 1: 10, 2: 20, 3: 50, 4: 900, 5: 100 },
          },
        },
        {},
      ]),
      state: helper.state,
      helper,
      createURL: () => '#',
    });

    {
      // Should call the rendering a second time, with isFirstRendering to false
      expect(rendering).toHaveBeenCalledTimes(2);
      const isFirstRendering =
        rendering.mock.calls[rendering.mock.calls.length - 1][1];
      expect(isFirstRendering).toBe(false);

      // should provide good values after the first search
      const { items } = rendering.mock.calls[
        rendering.mock.calls.length - 1
      ][0];
      expect(items).toEqual([
        {
          count: 1000,
          isRefined: false,
          name: '4',
          value: '4',
          stars: [true, true, true, true, false],
        },
        {
          count: 1050,
          isRefined: false,
          name: '3',
          value: '3',
          stars: [true, true, true, false, false],
        },
        {
          count: 1070,
          isRefined: false,
          name: '2',
          value: '2',
          stars: [true, true, false, false, false],
        },
        {
          count: 1080,
          isRefined: false,
          name: '1',
          value: '1',
          stars: [true, false, false, false, false],
        },
      ]);
    }
  });

  it('does not throw without the unmount function', () => {
    const rendering = () => {};
    const makeWidget = connectRatingMenu(rendering);
    const attribute = 'grade';
    const widget = makeWidget({
      attribute,
    });
    const config = widget.getConfiguration(new SearchParameters({}));
    const helper = jsHelper({}, '', config);

    expect(() => widget.dispose({ helper, state: helper.state })).not.toThrow();
  });

  it('Provides a function to update the index at each step', () => {
    const rendering = jest.fn();
    const makeWidget = connectRatingMenu(rendering);

    const attribute = 'grade';
    const widget = makeWidget({
      attribute,
    });

    const config = widget.getConfiguration(new SearchParameters({}));

    const helper = jsHelper({}, '', config);
    helper.search = jest.fn();

    widget.init({
      helper,
      state: helper.state,
      createURL: () => '#',
    });

    {
      // first rendering
      const renderOptions =
        rendering.mock.calls[rendering.mock.calls.length - 1][0];
      const { refine, items } = renderOptions;
      expect(items).toEqual([]);
      expect(helper.getRefinements(attribute)).toEqual([]);
      refine('3');
      expect(helper.getRefinements(attribute)).toEqual([
        { type: 'disjunctive', value: '3' },
        { type: 'disjunctive', value: '4' },
        { type: 'disjunctive', value: '5' },
      ]);
      expect(helper.search).toHaveBeenCalledTimes(1);
    }

    widget.render({
      results: new SearchResults(helper.state, [
        {
          facets: {
            [attribute]: { 3: 50, 4: 900, 5: 100 },
          },
        },
        {
          facets: {
            [attribute]: { 0: 5, 1: 10, 2: 20, 3: 50, 4: 900, 5: 100 },
          },
        },
      ]),
      state: helper.state,
      helper,
      createURL: () => '#',
    });

    {
      // Second rendering
      const renderOptions =
        rendering.mock.calls[rendering.mock.calls.length - 1][0];
      const { refine, items } = renderOptions;
      expect(items).toEqual([
        {
          count: 1000,
          isRefined: false,
          name: '4',
          value: '4',
          stars: [true, true, true, true, false],
        },
        {
          count: 1050,
          isRefined: true,
          name: '3',
          value: '3',
          stars: [true, true, true, false, false],
        },
        {
          count: 1070,
          isRefined: false,
          name: '2',
          value: '2',
          stars: [true, true, false, false, false],
        },
        {
          count: 1080,
          isRefined: false,
          name: '1',
          value: '1',
          stars: [true, false, false, false, false],
        },
      ]);
      expect(helper.getRefinements(attribute)).toEqual([
        { type: 'disjunctive', value: '3' },
        { type: 'disjunctive', value: '4' },
        { type: 'disjunctive', value: '5' },
      ]);
      refine('4');
      expect(helper.getRefinements(attribute)).toEqual([
        { type: 'disjunctive', value: '4' },
        { type: 'disjunctive', value: '5' },
      ]);
      expect(helper.search).toHaveBeenCalledTimes(2);
    }
  });

  describe('getConfiguration', () => {
    test('returns initial search parameters', () => {
      const rendering = jest.fn();
      const makeWidget = connectRatingMenu(rendering);

      const attribute = 'grade';
      const widget = makeWidget({
        attribute,
      });

      expect(widget.getConfiguration(new SearchParameters({}))).toEqual(
        new SearchParameters({
          disjunctiveFacets: [attribute],
          disjunctiveFacetsRefinements: {
            grade: [],
          },
        })
      );
    });

    test('supports previous disjunctive facets refinements', () => {
      const rendering = jest.fn();
      const makeWidget = connectRatingMenu(rendering);

      const attribute = 'grade';
      const widget = makeWidget({
        attribute,
      });

      expect(
        widget.getConfiguration(
          new SearchParameters({
            disjunctiveFacets: [attribute],
            disjunctiveFacetsRefinements: {
              grade: [4],
            },
          })
        )
      ).toEqual(
        new SearchParameters({
          disjunctiveFacets: [attribute],
          disjunctiveFacetsRefinements: {
            grade: [4],
          },
        })
      );
    });
  });

  describe('dispose', () => {
    test('calls the unmount function', () => {
      const render = jest.fn();
      const unmount = jest.fn();
      const makeWidget = connectRatingMenu(render, unmount);
      const helper = jsHelper({}, '', {});
      helper.search = jest.fn();

      const attribute = 'grade';
      const widget = makeWidget({
        attribute,
      });

      widget.dispose({ state: helper.state });

      expect(unmount).toHaveBeenCalledTimes(1);
    });

    test('resets the state', () => {
      const render = jest.fn();
      const makeWidget = connectRatingMenu(render);
      const indexName = 'indexName';
      const attribute = 'grade';
      const helper = jsHelper({}, indexName, {
        disjunctiveFacets: [attribute],
        disjunctiveFacetsRefinements: {
          [attribute]: [4, 5],
        },
      });
      helper.search = jest.fn();

      const widget = makeWidget({
        attribute,
      });

      expect(helper.state).toEqual(
        new SearchParameters({
          index: indexName,
          disjunctiveFacets: [attribute],
          disjunctiveFacetsRefinements: {
            grade: [4, 5],
          },
        })
      );

      const nextState = widget.dispose({ state: helper.state });

      expect(nextState).toEqual(
        new SearchParameters({
          index: indexName,
        })
      );
    });
  });

  describe('getWidgetState', () => {
    test('returns the `uiState` empty', () => {
      // Uses the function getInitializedWidget once we've removed `getConfiguration`
      const render = () => {};
      const makeWidget = connectRatingMenu(render);
      const helper = jsHelper({}, '');
      const widget = makeWidget({
        attribute: 'grade',
      });

      const actual = widget.getWidgetState(
        {},
        {
          searchParameters: helper.state,
          helper,
        }
      );

      expect(actual).toEqual({});
    });

    test('returns the `uiState` with a refinement', () => {
      // Uses the function getInitializedWidget once we've removed `getConfiguration`
      const render = () => {};
      const makeWidget = connectRatingMenu(render);
      const helper = jsHelper({}, '', {
        disjunctiveFacets: ['grade'],
        disjunctiveFacetsRefinements: {
          grade: ['2', '3', '4', '5'],
        },
      });

      const widget = makeWidget({
        attribute: 'grade',
      });

      const actual = widget.getWidgetState(
        {},
        {
          searchParameters: helper.state,
          helper,
        }
      );

      expect(actual).toEqual({
        ratingMenu: {
          grade: 2,
        },
      });
    });

    test('returns the `uiState` without namespace overridden', () => {
      // Uses the function getInitializedWidget once we've removed `getConfiguration`
      const render = () => {};
      const makeWidget = connectRatingMenu(render);
      const helper = jsHelper({}, '', {
        disjunctiveFacets: ['grade'],
        disjunctiveFacetsRefinements: {
          grade: ['2', '3', '4', '5'],
        },
      });

      const widget = makeWidget({
        attribute: 'grade',
      });

      const actual = widget.getWidgetState(
        {
          ratingMenu: {
            rating: 4,
          },
        },
        {
          searchParameters: helper.state,
          helper,
        }
      );

      expect(actual).toEqual({
        ratingMenu: {
          grade: 2,
          rating: 4,
        },
      });
    });
  });

  describe('getWidgetSearchParameters', () => {
    test('returns the `SearchParameters` with the default value', () => {
      // Uses the function getInitializedWidget once we've removed `getConfiguration`
      const render = () => {};
      const makeWidget = connectRatingMenu(render);
      const helper = jsHelper({}, '');
      const widget = makeWidget({
        attribute: 'grade',
      });

      const actual = widget.getWidgetSearchParameters(helper.state, {
        uiState: {},
      });

      expect(actual).toEqual(
        new SearchParameters({
          index: '',
          disjunctiveFacets: ['grade'],
          disjunctiveFacetsRefinements: {
            grade: [],
          },
        })
      );
    });

    test('returns the `SearchParameters` without the previous value', () => {
      // Uses the function getInitializedWidget once we've removed `getConfiguration`
      const render = () => {};
      const makeWidget = connectRatingMenu(render);
      const helper = jsHelper({}, '', {
        disjunctiveFacetsRefinements: {
          grade: ['2', '3', '4', '5'],
        },
      });

      const widget = makeWidget({
        attribute: 'grade',
      });

      const actual = widget.getWidgetSearchParameters(helper.state, {
        uiState: {},
      });

      expect(actual).toEqual(
        new SearchParameters({
          index: '',
          disjunctiveFacets: ['grade'],
          disjunctiveFacetsRefinements: {
            grade: [],
          },
        })
      );
    });

    test('returns the `SearchParameters` with the value from `uiState`', () => {
      // Uses the function getInitializedWidget once we've removed `getConfiguration`
      const render = () => {};
      const makeWidget = connectRatingMenu(render);
      const helper = jsHelper({}, '');
      const widget = makeWidget({
        attribute: 'grade',
      });

      const actual = widget.getWidgetSearchParameters(helper.state, {
        uiState: {
          ratingMenu: {
            grade: '3',
          },
        },
      });

      expect(actual).toEqual(
        new SearchParameters({
          index: '',
          disjunctiveFacets: ['grade'],
          disjunctiveFacetsRefinements: {
            grade: ['3', '4', '5'],
          },
        })
      );
    });

    test('returns the `SearchParameters` with the value from `uiState` without the previous refinement', () => {
      const render = () => {};
      const makeWidget = connectRatingMenu(render);
      const helper = jsHelper({}, '', {
        disjunctiveFacets: ['grade'],
        disjunctiveFacetsRefinements: {
          grade: ['1', '2', '3', '4', '5'],
        },
      });

      const widget = makeWidget({
        attribute: 'grade',
      });

      const actual = widget.getWidgetSearchParameters(helper.state, {
        uiState: {
          ratingMenu: {
            grade: '3',
          },
        },
      });

      expect(actual).toEqual(
        new SearchParameters({
          index: '',
          disjunctiveFacets: ['grade'],
          disjunctiveFacetsRefinements: {
            grade: ['3', '4', '5'],
          },
        })
      );
    });
  });
});