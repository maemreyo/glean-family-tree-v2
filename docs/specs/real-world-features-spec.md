# 🌳 Real-World Family Tree Features - Complete Checklist

Dựa trên research các ứng dụng gia phả phổ biến (Ancestry, MyHeritage, FamilySearch, WikiTree).

## ✅ Current Features (From CURRENT_IMPLEMENTATION.md)

- [x] Basic person management (CRUD)
- [x] Parent-child relationships & Spouses
- [x] Visual tree display (Auto layout)
- [x] Authentication & Realtime updates
- [x] Rich Profiles (Photos, Timeline, Bio, Extended Attributes)
- [x] Life Events (Birth, Death, Marriage, Career, Stories)
- [x] Export/Sharing (PDF, PNG, GEDCOM, JSON, Public Links)
- [x] Privacy Controls

## 🎯 Critical Missing Features (Backlog)

### 1. 👤 **Rich Person Profiles**

#### a) Photos & Media
```sql
CREATE TABLE person_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  is_primary BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Support for:
-- - Profile photo
-- - Multiple photos per person
-- - Photo albums
-- - Documents (birth certificates, etc.)
```

**UI Features:**
- Drag-and-drop upload
- Photo gallery
- Set primary photo
- Zoom/lightbox view

---

#### b) Life Events Timeline
```sql
CREATE TABLE life_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- birth, death, marriage, education, career, military, etc.
  event_date DATE,
  event_date_precision TEXT, -- exact, month, year, decade, century
  location_name TEXT,
  location_lat DECIMAL,
  location_lng DECIMAL,
  description TEXT,
  sources TEXT[], -- URLs or references
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Index for timeline queries
CREATE INDEX idx_life_events_person_date ON life_events(person_id, event_date);
```

**Event Types:**
- Birth
- Death
- Marriage/Divorce
- Education (school, college, graduation)
- Career (job start/end, promotion)
- Military service
- Immigration
- Residence changes
- Health events
- Other milestones

**UI Component:**
```tsx
// components/PersonTimeline.tsx
<Timeline>
  <TimelineItem date="1950-01-15" icon={<Baby />}>
    Born in New York City
  </TimelineItem>
  <TimelineItem date="1968-06" icon={<GraduationCap />}>
    Graduated from MIT
  </TimelineItem>
  <TimelineItem date="1975-03-20" icon={<Heart />}>
    Married to Jane Smith
  </TimelineItem>
</Timeline>
```

---

#### c) Extended Attributes
```sql
ALTER TABLE persons ADD COLUMN:
  nickname TEXT,
  birth_place TEXT,
  birth_place_lat DECIMAL,
  birth_place_lng DECIMAL,
  death_date DATE,
  death_place TEXT,
  death_cause TEXT,
  burial_place TEXT,
  occupation TEXT,
  education TEXT,
  religion TEXT,
  ethnicity TEXT,
  nationality TEXT,
  languages TEXT[],
  bio TEXT, -- Rich text biography
  sources TEXT[] -- Citations
```

---

### 2. 💑 **Complete Relationship Types**

```sql
ALTER TABLE relationships ADD COLUMN:
  marriage_date DATE,
  marriage_place TEXT,
  divorce_date DATE,
  relationship_status TEXT -- married, divorced, separated, widowed, engaged

-- Add constraint
ALTER TABLE relationships 
  ADD CONSTRAINT valid_relationship_type 
  CHECK (relationship_type IN (
    'parent-child',
    'spouse',
    'adopted',
    'foster',
    'step',
    'guardian',
    'godparent'
  ));
```

**Features:**
- Multiple marriages support
- Adoption records
- Step-family relationships
- Divorce tracking
- Marriage certificates

---

### 3. 📍 **Location & Places**

```sql
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT, -- city, country, cemetery, hospital, church
  latitude DECIMAL,
  longitude DECIMAL,
  parent_place_id UUID REFERENCES places(id),
  historical_names TEXT[], -- Former names
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link persons to places
ALTER TABLE persons ADD COLUMN birth_place_id UUID REFERENCES places(id);
ALTER TABLE life_events ADD COLUMN place_id UUID REFERENCES places(id);
```

**Features:**
- **Map view** of family locations
- Migration patterns visualization
- Historical place names
- Geocoding integration

**UI:**
```tsx
// components/FamilyMap.tsx
<MapView>
  <Marker lat={40.7128} lng={-74.0060}>
    <PersonPin person={person} />
  </Marker>
  <MigrationPath from="Ireland" to="USA" />
</MapView>
```

---

### 4. 📝 **Notes & Stories**

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Rich text (Markdown/HTML)
  note_type TEXT, -- story, memory, interview, research
  author_user_id UUID REFERENCES auth.users(id),
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tags for organization
CREATE TABLE note_tags (
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (note_id, tag)
);
```

**Features:**
- Rich text editor
- Markdown support
- Photo embedding
- Audio recordings
- Interview transcripts
- Private vs. public notes

---

### 5. 📎 **Document Management**

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- birth_cert, death_cert, marriage_cert, passport, etc.
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT, -- pdf, jpg, png
  file_size INTEGER,
  transcription TEXT, -- OCR text
  metadata JSONB, -- Certificate numbers, dates, etc.
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Document Types:**
- Birth certificates
- Death certificates
- Marriage licenses
- Passports
- Military records
- Immigration papers
- Wills
- Property deeds

**Features:**
- PDF viewer
- OCR text extraction
- Document tagging
- Search within documents

---

### 6. 🔍 **Search & Filter**

```sql
-- Full text search
CREATE INDEX idx_persons_search ON persons 
  USING gin(to_tsvector('english', name || ' ' || coalesce(bio, '')));

CREATE INDEX idx_notes_search ON notes 
  USING gin(to_tsvector('english', title || ' ' || content));
```

**UI Features:**
```tsx
// components/AdvancedSearch.tsx
<SearchForm>
  <Input name="name" placeholder="Name..." />
  <Input name="birthPlace" placeholder="Birth place..." />
  <DateRange name="birthDate" />
  <Select name="gender" />
  <Input name="occupation" placeholder="Occupation..." />
</SearchForm>
```

**Search Capabilities:**
- Name search (fuzzy matching)
- Date range filtering
- Location filtering
- Event type filtering
- Occupation search
- Save search queries

---

### 7. 📊 **Statistics & Reports**

```tsx
// components/FamilyStatistics.tsx
<StatsGrid>
  <StatCard
    title="Total Persons"
    value={persons.length}
    icon={<Users />}
  />
  <StatCard
    title="Generations"
    value={calculateGenerations()}
    icon={<GitBranch />}
  />
  <StatCard
    title="Oldest Person"
    value={getOldestPerson()}
    icon={<Cake />}
  />
  <StatCard
    title="Countries"
    value={getUniqueCountries()}
    icon={<Globe />}
  />
</StatsGrid>
```

**Reports:**
- Family statistics
- Surname distribution
- Geographic distribution
- Lifespan analysis
- Common occupations
- Generation chart
- Descendant report
- Ancestor report
- Missing information report

---

### 8. 🔐 **Privacy & Sharing**

```sql
-- Privacy settings per person
ALTER TABLE persons ADD COLUMN:
  privacy_level TEXT DEFAULT 'private', -- private, family, public
  is_living BOOLEAN DEFAULT true;

-- Sharing & collaboration
CREATE TABLE family_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_owner_id UUID REFERENCES auth.users(id),
  collaborator_id UUID REFERENCES auth.users(id),
  permission_level TEXT, -- view, edit, admin
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE
);
```

**Features:**
- Living person privacy rules
- Invite family members
- Permission levels (view/edit/admin)
- Public family tree option
- Link sharing
- Password-protected trees

---

### 9. 📥 **Import/Export (Enhanced)**

**Import Formats:**
- GEDCOM (.ged) - Industry standard
- JSON
- CSV
- FamilySearch
- Ancestry.com
- MyHeritage

**Export Formats:**
- GEDCOM
- PDF book/report
- JSON backup
- CSV
- PNG/SVG tree image
- HTML website

```tsx
// components/ImportExport.tsx
<Tabs>
  <TabsList>
    <TabsTrigger value="import">Import</TabsTrigger>
    <TabsTrigger value="export">Export</TabsTrigger>
  </TabsList>
  
  <TabsContent value="import">
    <DropZone accept=".ged,.json,.csv">
      Drop GEDCOM file here
    </DropZone>
  </TabsContent>
  
  <TabsContent value="export">
    <ExportOptions>
      <Option format="gedcom" />
      <Option format="pdf" />
      <Option format="json" />
    </ExportOptions>
  </TabsContent>
</Tabs>
```

---

### 10. 🎨 **Enhanced Visualization**

#### a) Multiple View Types
```tsx
<TreeViewSelector>
  <ViewOption value="standard">Standard Tree</ViewOption>
  <ViewOption value="fan">Fan Chart</ViewOption>
  <ViewOption value="hourglass">Hourglass</ViewOption>
  <ViewOption value="descendant">Descendant Chart</ViewOption>
  <ViewOption value="timeline">Timeline View</ViewOption>
  <ViewOption value="list">List View</ViewOption>
</TreeViewSelector>
```

#### b) Customization
- Color coding by:
  - Gender
  - Generation
  - Living status
  - Branch
  - Location
- Node style customization
- Compact vs. detailed view
- Show/hide deceased
- Focus on person (center view)

---

### 11. 🔔 **Notifications & Activity**

```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  activity_type TEXT, -- person_added, relationship_added, photo_uploaded, etc.
  entity_type TEXT, -- person, relationship, photo, etc.
  entity_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Features:**
- Activity feed
- "What's new" section
- Email notifications for collaborators
- Milestones (100th person, etc.)

---

### 12. 🔗 **DNA & Genetic Features** (Advanced)

```sql
CREATE TABLE dna_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES persons(id),
  test_company TEXT, -- 23andMe, AncestryDNA, etc.
  test_date DATE,
  ethnicity_data JSONB,
  haplogroup TEXT,
  matches_count INTEGER,
  raw_data_url TEXT,
  user_id UUID REFERENCES auth.users(id)
);

CREATE TABLE dna_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person1_id UUID REFERENCES persons(id),
  person2_id UUID REFERENCES persons(id),
  shared_cm DECIMAL, -- Centimorgans
  relationship_estimate TEXT,
  confidence_level TEXT
);
```

**Features:**
- DNA test result upload
- Ethnicity pie chart
- DNA match management
- Relationship calculator
- Chromosome browser

---

### 13. 📱 **Mobile Features**

- Responsive design
- Touch-friendly tree navigation
- Photo capture directly from camera
- Offline mode
- Push notifications
- QR code sharing

---

### 14. 🤖 **Smart Features (AI-Powered)**

```tsx
// Suggestions & Hints
<SmartSuggestions>
  <Suggestion type="duplicate">
    "John Smith (1950)" might be duplicate of "J. Smith (1950)"
  </Suggestion>
  <Suggestion type="missing">
    Missing spouse for "Jane Doe"
  </Suggestion>
  <Suggestion type="data">
    Add death date for "Robert Wilson" (age 150+)
  </Suggestion>
</SmartSuggestions>
```

**AI Features:**
- Duplicate detection
- Data quality suggestions
- Missing information hints
- Relationship suggestions
- Auto-transcribe documents (OCR)
- Face recognition in photos
- Name variations matching

---

### 15. 🎓 **Research Tools**

```sql
CREATE TABLE research_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES persons(id),
  task_title TEXT NOT NULL,
  task_description TEXT,
  priority TEXT, -- high, medium, low
  status TEXT, -- todo, in_progress, done
  assigned_to UUID REFERENCES auth.users(id),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT,
  publisher TEXT,
  publication_date DATE,
  url TEXT,
  repository TEXT, -- Archive, library, website
  citation TEXT,
  notes TEXT
);

-- Link sources to entities
CREATE TABLE source_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES sources(id),
  entity_type TEXT, -- person, event, relationship
  entity_id UUID,
  page_number TEXT,
  confidence TEXT, -- primary, secondary, tertiary
  notes TEXT
);
```

**Features:**
- Research task list
- Source management
- Citation tracking
- Evidence evaluation
- Conflicting information resolution
- Research log

---

### 16. 🌍 **Multi-language Support**

```sql
ALTER TABLE persons ADD COLUMN:
  name_variants JSONB, -- {"zh": "李明", "en": "Li Ming"}
  
ALTER TABLE life_events ADD COLUMN:
  description_i18n JSONB -- {"en": "...", "vi": "..."}
```

**Features:**
- Interface translation
- Multiple name variants
- Date format localization
- Cultural calendar support

---

## 📊 Feature Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Photos & Media | 🔥 High | Medium | ⭐⭐⭐ Urgent |
| Life Events | 🔥 High | Medium | ⭐⭐⭐ Urgent |
| Export (PDF/Image) | 🔥 High | Low | ⭐⭐⭐ Urgent |
| Extended Attributes | 🔥 High | Low | ⭐⭐ High |
| Spouse Relationships | 🔥 High | Low | ⭐⭐ High |
| Notes & Stories | High | Medium | ⭐⭐ High |
| Document Management | High | High | ⭐ Medium |
| Search & Filter | High | Medium | ⭐ Medium |
| Statistics | Medium | Low | ⭐ Medium |
| Privacy & Sharing | High | High | ⭐ Medium |
| Multiple Tree Views | Medium | High | Low |
| DNA Features | Low | Very High | Low |
| AI Features | Low | Very High | Low |

---

## 🚀 Implementation Roadmap

### Phase 1: Core Enhancements (2-3 weeks)
1. Photos & avatars
2. Life events timeline
3. Extended person attributes
4. Export to PDF/PNG
5. Spouse relationships

### Phase 2: Content & Documentation (2 weeks)
1. Notes & stories
2. Document management
3. Sources & citations
4. Search & filter

### Phase 3: Collaboration (1-2 weeks)
1. Privacy settings
2. Sharing & invitations
3. Activity feed
4. Notifications

### Phase 4: Advanced Features (2-3 weeks)
1. Multiple tree views
2. Statistics & reports
3. Import GEDCOM
4. Research tools

### Phase 5: Polish & Scale (1-2 weeks)
1. Mobile optimization
2. Performance optimization
3. Smart suggestions
4. Multi-language

---

## 💡 Quick Wins (Implement First)

These give maximum impact with minimum effort:

1. **Person Photos** (1 day)
   - Profile photo upload
   - Display in tree nodes
   - Supabase Storage integration

2. **Extended Attributes** (0.5 day)
   - Add birth_place, death_date fields
   - Simple form fields

3. **Export to PDF** (1 day)
   - Use provided implementation
   - Instant user value

4. **Life Events** (2 days)
   - Basic event types
   - Timeline UI
   - CRUD operations

5. **Notes** (1 day)
   - Simple text notes
   - Textarea + save button

**Total: ~5-6 days for 5 major features!**

---

## 🎯 Competitive Features Analysis

To compete with major genealogy platforms:

**Must Have:**
- ✅ Photos
- ✅ Life events
- ✅ Documents
- ✅ Export/Import
- ✅ Search
- ✅ Collaboration

**Nice to Have:**
- Multiple tree views
- Statistics
- DNA integration
- AI suggestions

**Differentiators:**
- 🚀 Modern, fast UI (React + Next.js)
- 🎨 Beautiful visualization (ReactFlow)
- 🔄 Realtime collaboration
- 🔐 Privacy-first (self-hosted option)
- 📱 Mobile-first design

---

Ready to implement? Start with Quick Wins! 🚀
